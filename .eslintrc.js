/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    '@tech-news-platform/eslint-config/base'
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    '*.config.js',
    '*.config.ts'
  ]
};
