import { AST_NODE_TYPES, TSESTree, ESLintUtils } from '@typescript-eslint/utils'
import { createRule } from '../utils/create-rule.js'

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression

type ReturnExpression = TSESTree.Expression | TSESTree.ReturnStatement
type ScopeInfo = {
  owningFunc: FunctionNode
  returns: ReturnExpression[]
}

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
      nonResultReturn: 'Return an Ok or Err here',
    },
    schema: [],
  },
  defaultOptions: [],
  create (context) {
    const parserServices = ESLintUtils.getParserServices(context)
    const checker = parserServices.program.getTypeChecker()

    const scopeInfoStack: ScopeInfo[] = []

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

      scopeInfo.returns.forEach((node) => {
        if (!isResultExpression(node)) {
          context.report({
            node,
            messageId: 'nonResultReturn',
          })
        }
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

      ReturnStatement (node) {
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
