import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import {
  consistentTypeImportsRule,
  importSortRule,
  kichulbotRule,
  zodNamespaceImportRule,
} from './rules.js';

export function reactNativeConfig({ ignores = [], tsconfigRootDir } = {}) {
  return defineConfig([
    globalIgnores(['dist/**', ...ignores]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
    importSortRule,
    kichulbotRule,
    {
      rules: {
        ...consistentTypeImportsRule,
        ...zodNamespaceImportRule,
      },
    },
  ]);
}
