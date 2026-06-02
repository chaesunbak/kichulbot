import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const BUTTON_IMPORT_SOURCES = new Set([
  '@kichulbot/ui/components/button',
  './button',
]);

const requireButtonTypeRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require an explicit type prop on the shared Button component.',
    },
    fixable: 'code',
    messages: {
      missingType:
        'Add an explicit type prop to Button. Use type="button" unless this intentionally submits a form.',
      missingTypeInForm:
        'Add an explicit type prop to Button inside form. Use type="submit" for submit actions or type="button" otherwise.',
    },
    schema: [],
  },
  create(context) {
    const buttonComponentNames = new Set();

    function hasAttribute(node, name) {
      return node.attributes.some(
        (attribute) =>
          attribute.type === 'JSXAttribute' && attribute.name.name === name,
      );
    }

    function isInsideForm(node) {
      let currentNode = node.parent;

      while (currentNode) {
        if (
          currentNode.type === 'JSXElement' &&
          currentNode.openingElement.name.type === 'JSXIdentifier' &&
          currentNode.openingElement.name.name === 'form'
        ) {
          return true;
        }

        currentNode = currentNode.parent;
      }

      return false;
    }

    return {
      ImportDeclaration(node) {
        if (!BUTTON_IMPORT_SOURCES.has(node.source.value)) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.name === 'Button'
          ) {
            buttonComponentNames.add(specifier.local.name);
          }
        }
      },
      JSXOpeningElement(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          !buttonComponentNames.has(node.name.name) ||
          hasAttribute(node, 'type') ||
          hasAttribute(node, 'asChild')
        ) {
          return;
        }

        context.report({
          node,
          messageId: isInsideForm(node) ? 'missingTypeInForm' : 'missingType',
          fix(fixer) {
            return fixer.insertTextAfter(node.name, ' type="button"');
          },
        });
      },
    };
  },
};

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

export const consistentTypeImportsRule = {
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'separate-type-imports',
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

export const kichulbotRule = {
  plugins: {
    kichulbot: {
      rules: {
        'require-button-type': requireButtonTypeRule,
      },
    },
  },
  rules: {
    'kichulbot/require-button-type': 'error',
  },
};
