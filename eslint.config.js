const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error',
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'quote-props': ['error', 'as-needed'],
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'require-await': 'error',
    },
  },
];
