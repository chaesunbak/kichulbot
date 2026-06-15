export const paperKeys = {
  all: ['papers'] as const,
  lists: () => [...paperKeys.all, 'list'] as const,
  // 현재 목록 필터는 없지만, 추후 필터별 목록 키를 분리할 수 있도록 list 계층을 유지합니다.
  list: () => [...paperKeys.lists()] as const,
  importJobs: () => [...paperKeys.all, 'import-jobs'] as const,
  details: () => [...paperKeys.all, 'detail'] as const,
  detail: (paperId: string) => [...paperKeys.details(), paperId] as const,
};
