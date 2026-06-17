import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  consistentTypeImportsRule,
  importSortRule,
  zodNamespaceImportRule,
} from './rules.js';

export function nestConfig({ ignores = [], tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: ['dist', 'eslint.config.mjs', ...ignores],
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
        ...consistentTypeImportsRule,
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
