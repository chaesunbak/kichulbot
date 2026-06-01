import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export const importSortRule = {
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
  },
};

export const zodNamespaceImportRule = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "ImportDeclaration[source.value='zod'] > ImportSpecifier",
      message: 'Use `import * as z from "zod"` instead of named import',
    },
  ],
};

export function betterTailwindConfig({
  entryPoint = 'src/app/globals.css',
} = {}) {
  return {
    ...betterTailwindcss.configs.recommended,
    settings: {
      'better-tailwindcss': {
        entryPoint,
      },
    },
  };
}
