import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils'

export function getParentFunctionNode (
  node: TSESTree.Node,
):
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | null {
  let current = node.parent
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
      || current.type === AST_NODE_TYPES.FunctionDeclaration
      || current.type === AST_NODE_TYPES.FunctionExpression
    ) {
      return current
    }

    current = current.parent
  }

  // this shouldn't happen in correct code, but someone may attempt to parse bad code
  // the parser won't error, so we shouldn't throw here
  return null
}
