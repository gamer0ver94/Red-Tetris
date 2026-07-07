import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'node_modules',
    'src/client/dist',
    'src/client/coverage',
    'src/client/node_modules',
    'src/server/dist',
    'src/server/coverage',
    'src/server/node_modules',
  ]),

  {
    files: ['src/client/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  {
    files: ['src/server/**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },

  {
    files: [
      'src/server/test/**/*.ts',
      'src/server/test/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
])
