import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { importSortRule, zodNamespaceImportRule } from './rules.js';

export function nestConfig({ tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: ['dist', 'eslint.config.mjs'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: 'commonjs',
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    importSortRule,
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        ...zodNamespaceImportRule,
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
    {
      files: ['**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  );
}
