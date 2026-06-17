import type { BookmarkListSummary, Library } from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

export async function getLibrary(): Promise<Library> {
  const res = await clientApi.get<{ data: Library }>('/api/me/library');
  return res.data;
}

export async function getBookmarkLists(): Promise<BookmarkListSummary[]> {
  const res = await clientApi.get<{
    data: { bookmarkLists: BookmarkListSummary[] };
  }>('/api/me/question-lists');
  return res.data.bookmarkLists;
}
