import { ApiError } from '@kichulbot/api-contract';

import { getAuthContext } from '@/features/auth/lib/server-auth';
import type {
  BookmarkList,
  BookmarkListSummary,
  Library,
} from '@/features/learning/types';
import { serverApi } from '@/shared/api/server';

export const getLibrary = async (): Promise<Library> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');
  const res = await serverApi.get<{ data: Library }>(
    '/me/library',
    context.token,
  );
  return res.data;
};

export const getBookmarkLists = async (): Promise<BookmarkListSummary[]> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');
  const res = await serverApi.get<{
    data: { bookmarkLists: BookmarkListSummary[] };
  }>('/me/question-lists', context.token);
  return res.data.bookmarkLists;
};

export const getBookmarkList = async (id: string): Promise<BookmarkList> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');
  const res = await serverApi.get<{ data: { bookmarkList: BookmarkList } }>(
    `/me/question-lists/${id}`,
    context.token,
  );
  return res.data.bookmarkList;
};
