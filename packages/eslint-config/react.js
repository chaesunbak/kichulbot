import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import {
  betterTailwindConfig,
  importSortRule,
  zodNamespaceImportRule,
} from './rules.js';

export function reactConfig({ ignores = [] } = {}) {
  return defineConfig([
    globalIgnores(['dist/**', ...ignores]),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    importSortRule,
    betterTailwindConfig(),
    {
      rules: {
        ...zodNamespaceImportRule,
      },
    },
  ]);
}
