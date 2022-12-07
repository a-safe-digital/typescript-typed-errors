import { ESLintUtils } from '@typescript-eslint/utils'

export const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/fathom3-dev/eslint-plugin-typescript-typed-errors/blob/main/docs/${name}.md`,
)
