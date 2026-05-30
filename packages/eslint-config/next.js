import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import { zodNamespaceImportRule } from './rules.js';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      ...zodNamespaceImportRule,
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
