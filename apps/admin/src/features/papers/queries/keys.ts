export const paperKeys = {
  all: ['papers'] as const,
  lists: () => [...paperKeys.all, 'list'] as const,
  list: () => [...paperKeys.lists()] as const,
  importJobs: () => [...paperKeys.all, 'import-jobs'] as const,
  details: () => [...paperKeys.all, 'detail'] as const,
  detail: (paperId: string) => [...paperKeys.details(), paperId] as const,
};
