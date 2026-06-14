export const referenceDataKeys = {
  all: ['reference-data'] as const,
  exams: () => [...referenceDataKeys.all, 'exams'] as const,
  categories: () => [...referenceDataKeys.all, 'categories'] as const,
};
