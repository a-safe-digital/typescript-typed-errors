import { AST_NODE_TYPES as ANT, TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../utils/create-rule.js'

type FunctionNode =
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression

type WrapScope = {
  upper: WrapScope | null
  fn: FunctionNode
  callee: TSESTree.Identifier
  param: TSESTree.TypeNode // maybe we dont need this
  inFn: boolean
  unwrappedFns: Map<string, TSESTree.CallExpression>
  wrappedFns: Map<string, TSESTree.TSTypeQuery>
}

export default createRule({
  name: 'consistent-unwrap',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'wrapped functions must specify the types of functions being unwrapped',
      recommended: 'error',
      requiresTypeChecking: false,
    },
    messages: {
      badWrap: 'specify all the types of functions being unwrapped',
      badUnwrap: 'this unwrapped function must be specified on the wrap type parameters',
      missingTypeParamInWrap: 'the wrap function must specify one type parameter with an union of types of the functions being unwrapped',
      badUnwrapArg: 'unwrap argument must be a call expression',
      badWrapTypeArg: 'wrap type parameter must be an union of typeof functionName of every function being unwrapped',
      duplicatedWrapArg: 'You only need to specify wrap parameters once.',
      unwrapNotInWrap: 'You must add this function type to wrap type parameter',
      wrappedFnNotUnwrapped: 'You are not unwrapping this function',
    },
    schema: [],
  },
  defaultOptions: [],
  create (context) {
    let wrappedScope: WrapScope | null = null

    function enterFunction (fn: FunctionNode) {
      if (!wrappedScope || wrappedScope.fn !== fn) return
      wrappedScope.inFn = true
    }
    function exitFunction (fn: FunctionNode) {
      if (!wrappedScope || wrappedScope.fn !== fn) return
      const { param, callee, unwrappedFns, wrappedFns } = wrappedScope

      const missingWraps: string[] = []
      unwrappedFns.forEach((node, fnName) => {
        if (!wrappedFns.has(fnName)) {
          missingWraps.push(fnName)
          context.report({ messageId: 'unwrapNotInWrap', node })
        }
      })

      const excedingWraps: string[] = []
      wrappedFns.forEach((node, fnName) => {
        if (!unwrappedFns.has(fnName)) {
          excedingWraps.push(fnName)
          context.report({ messageId: 'wrappedFnNotUnwrapped', node })
        }
      })

      if (
        excedingWraps.length !== 0
        || missingWraps.length !== 0
      ) {
        context.report({
          messageId: 'badWrap',
          node: callee,
          fix: (fixer) => {
            const fixed = [...unwrappedFns.keys()].map((fn) => `typeof ${fn}`).join(' | ')
            return fixer.replaceTextRange(param.range, fixed)
          },
        })
      }

      wrappedScope = wrappedScope?.upper || null
    }

    function onWrapCall (node: TSESTree.CallExpression) {
      const { callee, typeParameters } = node
      if (!(callee.type === ANT.Identifier && callee.name === 'wrap')) {
        return
      }
      if (!node.parent) return
      if (node.parent.type !== ANT.CallExpression) return
      if (node.parent.arguments.length !== 1) return

      const fn = node.parent.arguments[0]
      if (!(
        fn.type === ANT.FunctionExpression
        || fn.type === ANT.ArrowFunctionExpression
      )) return
      if (!fn.async) return

      if (!typeParameters || typeParameters.params.length !== 1) {
        context.report({ messageId: 'missingTypeParamInWrap', node: callee })
        return
      }

      const param = typeParameters.params[0]
      const types = param.type === ANT.TSUnionType
        ? param.types
        : [param]

      const wrappedFns: Map<string, TSESTree.TSTypeQuery> = new Map()

      types.forEach((tnode) => {
        if (
          tnode.type !== ANT.TSTypeQuery
          || tnode.exprName.type !== ANT.Identifier
        ) {
          context.report({
            node: tnode,
            messageId: 'badWrapTypeArg',
          })
        } else if (wrappedFns.has(tnode.exprName.name)) {
          context.report({
            node: tnode,
            messageId: 'duplicatedWrapArg',
            fix: (fixer) => {
              return fixer.remove(tnode)
            },
          })
        } else {
          wrappedFns.set(tnode.exprName.name, tnode)
        }
      })

      wrappedScope = {
        upper: wrappedScope,
        fn,
        callee,
        inFn: false,
        param,
        unwrappedFns: new Map(),
        wrappedFns,
      }
    }

    function onUnwrapCall (node: TSESTree.CallExpression) {
      if (!wrappedScope || !wrappedScope.inFn) return

      const { callee } = node
      if (!(callee.type === ANT.Identifier && callee.name === 'unwrap')) {
        return
      }
      if (node.arguments.length !== 1) return

      const [arg] = node.arguments
      const callExpr = arg.type === ANT.AwaitExpression
        ? arg.argument
        : arg

      if (
        callExpr.type !== ANT.CallExpression
        || callExpr.callee.type !== ANT.Identifier
      ) {
        context.report({ messageId: 'badUnwrapArg', node })
        return
      }

      wrappedScope.unwrappedFns.set(callExpr.callee.name, callExpr)
    }

    return {
      CallExpression (node) {
        onWrapCall(node)
        onUnwrapCall(node)
      },

      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,

      'FunctionExpression:exit': exitFunction,
      'ArrowFunctionExpression:exit': exitFunction,

    }
  },
})
