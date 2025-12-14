import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactDom from 'eslint-plugin-react-dom'
import react from 'eslint-plugin-react-x'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      reactDom.configs.recommended,
      react.configs.recommended,
    ],
    plugins: { prettier },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Prettier formatting integration: running eslint --fix will reformat
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
          semi: false,
          printWidth: 100,
          trailingComma: 'es5',
        },
      ],
    },
  },
])
