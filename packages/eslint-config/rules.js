export const zodNamespaceImportRule = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "ImportDeclaration[source.value='zod'] > ImportSpecifier",
      message: 'Use `import * as z from "zod"` instead of named import',
    },
  ],
};
