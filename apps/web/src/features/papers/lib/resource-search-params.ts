import { createLoader, parseAsString } from 'nuqs/server';

export const resourceSearchParsers = {
  q: parseAsString.withDefault(''),
  categoryId: parseAsString.withDefault(''),
  examId: parseAsString.withDefault(''),
};

export const loadResourceSearchParams = createLoader(resourceSearchParsers);
