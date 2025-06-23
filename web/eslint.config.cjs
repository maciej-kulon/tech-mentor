// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const unusedImports = require('eslint-plugin-unused-imports');

/**
 * ESLint flat config for Angular project
 * - Disallows any/unknown
 * - Disallows unnecessary/double boolean casting
 * - Integrates Prettier
 * - Enforces Angular and TypeScript standards
 * - No exceptions, autofix where possible
 */

module.exports = tseslint.config({
  files: ['**/*.ts'],
  ignores: ['**/*.html', '**/node_modules/**', '**/*.d.ts'],
  plugins: {
    'unused-imports': unusedImports,
  },
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    ...angular.configs.tsRecommended,
    prettierRecommended,
  ],
  processor: angular.processInlineTemplates,
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    'no-extra-boolean-cast': ['error', { enforceForInnerExpressions: true }],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
  languageOptions: {
    parserOptions: {
      project: './tsconfig.app.json',
    },
  },
});
