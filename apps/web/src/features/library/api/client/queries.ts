import type { BookmarkListSummary, Library } from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

export async function getLibrary(): Promise<Library> {
  return clientApi.get<Library>('/api/me/library');
}

export async function getBookmarkLists(): Promise<BookmarkListSummary[]> {
  const body = await clientApi.get<{
    bookmarkLists: BookmarkListSummary[];
  }>('/api/me/question-lists');
  return body.bookmarkLists;
}
