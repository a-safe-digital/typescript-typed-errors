import { AST_NODE_TYPES, TSESTree, ESLintUtils, ASTUtils } from '@typescript-eslint/utils'
import { createRule } from '../utils/create-rule.js'
import { CodePath } from '../types/code-path'

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression

type ReturnExpression = TSESTree.Expression | TSESTree.ReturnStatement
type ScopeInfo = {
  owningFunc: FunctionNode
  returns: ReturnExpression[]
}
type PathInfo = {
  upper: PathInfo
  codePath: CodePath
  hasReturn: boolean
  node: TSESTree.Node
} | null

export default createRule({
  name: 'consistent-result-return',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Functions that return an Ok or Err, should only return Result types',
      recommended: 'error',
      requiresTypeChecking: true,
    },
    messages: {
      nonResultReturn: '{{name}} expected to return an Ok or Err result',
      implicitUndefined: '{{name}} implicitly returns undefined. Expected to always return Ok or Err.',
    },
    schema: [],
  },
  defaultOptions: [],
  create (context) {
    const parserServices = ESLintUtils.getParserServices(context)
    const checker = parserServices.program.getTypeChecker()

    const scopeInfoStack: ScopeInfo[] = []
    let pathInfo: PathInfo = null

    function enterFunction (node: FunctionNode): void {
      scopeInfoStack.push({
        owningFunc: node,
        returns: [],
      })
    }

    function isResultExpression (node: ReturnExpression) {
      if (node.type === AST_NODE_TYPES.ReturnStatement && !node.argument) {
        return false
      }

      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
      const nodeType = checker.getTypeAtLocation(tsNode)

      return nodeType.aliasSymbol?.name === 'OkResult'
        || nodeType.aliasSymbol?.name === 'ErrResult'
    }

    function exitFunction (): void {
      const scopeInfo = scopeInfoStack.pop()
      if (!scopeInfo) return

      const returnsResult = scopeInfo.returns.some(isResultExpression)
      if (!returnsResult) return

      const { owningFunc } = scopeInfo
      const name = ASTUtils.getFunctionNameWithKind(owningFunc)

      scopeInfo.returns.forEach((node) => {
        if (!isResultExpression(node)) {
          context.report({
            node,
            messageId: 'nonResultReturn',
            data: { name },
          })
        }
      })

      // implicit undefined return check
      if (
        !pathInfo?.hasReturn
        || pathInfo.codePath.currentSegments.every((s) => !s.reachable)
      ) {
        return
      }

      let loc

      if (owningFunc.type === 'ArrowFunctionExpression') {
        loc = context.getSourceCode().getTokenBefore(owningFunc.body, ASTUtils.isArrowToken)?.loc
      } else if (
        owningFunc.parent && (
          owningFunc.parent.type === 'MethodDefinition'
          || (owningFunc.parent.type === 'Property' && owningFunc.parent.method)
        )
      ) {
        // Method name.
        loc = owningFunc.parent.key.loc
      } else {
        loc = (owningFunc.id || context.getSourceCode().getFirstToken(owningFunc))?.loc
      }

      context.report({
        loc: loc || owningFunc.loc,
        messageId: 'implicitUndefined',
        data: { name },
      })
    }

    function findReturnedNodes (
      node: TSESTree.Expression,
    ): TSESTree.Expression[] {
      if (node.type === AST_NODE_TYPES.ConditionalExpression) {
        return [
          ...findReturnedNodes(node.alternate),
          ...findReturnedNodes(node.consequent),
        ]
      }
      return [node]
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,

      'FunctionDeclaration:exit': exitFunction,
      'FunctionExpression:exit': exitFunction,
      'ArrowFunctionExpression:exit': exitFunction,

      // Initializes/Disposes state of each code path.
      onCodePathStart (_codePath: unknown, node?: TSESTree.Node) {
        const codePath = _codePath as CodePath

        pathInfo = {
          upper: pathInfo,
          codePath,
          hasReturn: false,
          node: node!,
        }
      },
      onCodePathEnd () {
        pathInfo = pathInfo!.upper
      },

      ReturnStatement (node) {
        if (pathInfo && !pathInfo.hasReturn) {
          pathInfo.hasReturn = true
        }
        const scopeInfo = scopeInfoStack[scopeInfoStack.length - 1]

        if (!node.argument) {
          scopeInfo.returns.push(node)
          return
        }

        findReturnedNodes(node.argument).forEach(node => {
          scopeInfo.returns.push(node)
        })
      },
    }
  },
})
