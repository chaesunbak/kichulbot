import { getToken } from '@/features/auth/server';
import type {
  BookmarkList,
  BookmarkListSummary,
  Library,
} from '@/features/learning/types';
import { serverApi } from '@/shared/api/server';

export const getLibrary = async (): Promise<Library> => {
  const token = await getToken();
  if (!token) return { folders: [], papers: [] };
  const res = await serverApi.get<{ data: Library }>('/me/library', token);
  return res.data;
};

export const getBookmarkLists = async (): Promise<BookmarkListSummary[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{
    data: { bookmarkLists: BookmarkListSummary[] };
  }>('/me/question-lists', token);
  return res.data.bookmarkLists;
};

export const getBookmarkList = async (id: string): Promise<BookmarkList> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await serverApi.get<{ data: { bookmarkList: BookmarkList } }>(
    `/me/question-lists/${id}`,
    token,
  );
  return res.data.bookmarkList;
};
