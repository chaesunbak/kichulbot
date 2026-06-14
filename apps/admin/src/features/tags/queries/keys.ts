export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (examId?: string) => [...tagKeys.lists(), { examId }] as const,
  adminList: () => [...tagKeys.all, 'admin-list'] as const,
  groupLists: () => [...tagKeys.all, 'group-list'] as const,
  groupList: (examId?: string) =>
    [...tagKeys.groupLists(), { examId }] as const,
};
