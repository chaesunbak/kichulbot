import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import {
  betterTailwindConfig,
  consistentTypeImportsRule,
  importSortRule,
  kichulbotRule,
  zodNamespaceImportRule,
} from './rules.js';

export function nextConfig({ tsconfigRootDir } = {}) {
  return defineConfig([
    ...nextVitals,
    ...nextTs,
    {
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
    },
    importSortRule,
    kichulbotRule,
    betterTailwindConfig(),
    {
      rules: {
        ...consistentTypeImportsRule,
        ...zodNamespaceImportRule,
      },
    },
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  ]);
}

export default nextConfig();
