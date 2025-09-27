/** @type {import('prettier').Config} */
module.exports = {
  // 基础格式化选项
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  
  // 换行和长度
  printWidth: 80,
  endOfLine: 'lf',
  
  // JSX 特定选项
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // 其他选项
  arrowParens: 'avoid',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  
  // 文件特定覆盖
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
  ],
};
