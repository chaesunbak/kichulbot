import { queryOptions } from '@tanstack/react-query';

import { fetchMe } from '../client/queries';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export function meQueryOptions(token: string) {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const data = await fetchMe(token);
      if (data.user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 있는 계정으로 로그인해 주세요.');
      }
      return data;
    },
    retry: false,
  });
}
