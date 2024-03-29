module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.lib.json', 'tsconfig.spec.json', 'tsconfig.eslint.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', '@a-safe-digital/typescript-typed-errors'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@a-safe-digital/typescript-typed-errors/recommended',
    'standard',
  ],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    'operator-linebreak': ['error', 'before'],
    // no-undef already handled by the ts compiler
    'no-undef': 'off',
    // No unused vars is already handled by the ts compiler
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    // Allow for typescript function overload
    'no-redeclare': 'off',
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-dupe-class-members': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['*.ts'],
      rules: { },
    },
    {
      files: ['*.spec.ts', '*.test.ts', 'tests/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
}
