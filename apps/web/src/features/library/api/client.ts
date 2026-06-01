import { clientApi } from '@/shared/api/client';
import type {
  BookmarkListSummary,
  Library,
  LibraryFolder,
} from '@/features/learning/types';

export async function getLibrary(): Promise<Library> {
  return clientApi.get<Library>('/api/me/library');
}

export async function createBookmarkList(
  name: string,
): Promise<BookmarkListSummary> {
  const body = await clientApi.post<{ bookmarkList: BookmarkListSummary }>(
    '/api/me/question-lists',
    { name },
  );
  return body.bookmarkList;
}

export async function getBookmarkLists(): Promise<BookmarkListSummary[]> {
  const body = await clientApi.get<{
    bookmarkLists: BookmarkListSummary[];
  }>('/api/me/question-lists');
  return body.bookmarkLists;
}

export async function addQuestionToBookmarkList({
  bookmarkListId,
  questionId,
}: {
  bookmarkListId: string;
  questionId: string;
}): Promise<void> {
  await clientApi.put(
    `/api/me/question-lists/${bookmarkListId}/questions/${questionId}`,
  );
}

export async function removeQuestionFromBookmarkList({
  bookmarkListId,
  questionId,
}: {
  bookmarkListId: string;
  questionId: string;
}): Promise<void> {
  await clientApi.delete(
    `/api/me/question-lists/${bookmarkListId}/questions/${questionId}`,
  );
}

export async function createLibraryFolder({
  name,
  parentId,
}: {
  name: string;
  parentId: string | null;
}): Promise<LibraryFolder> {
  const body = await clientApi.post<{ folder: LibraryFolder }>(
    '/api/me/library/folders',
    { name, parentId },
  );
  return body.folder;
}

export async function renameLibraryFolder({
  folderId,
  name,
}: {
  folderId: string;
  name: string;
}): Promise<LibraryFolder> {
  const body = await clientApi.patch<{ folder: LibraryFolder }>(
    `/api/me/library/folders/${folderId}`,
    { name },
  );
  return body.folder;
}

export async function deleteLibraryFolder(folderId: string): Promise<void> {
  await clientApi.delete(`/api/me/library/folders/${folderId}`);
}

export async function moveLibraryPaper({
  libraryPaperId,
  folderId,
}: {
  libraryPaperId: string;
  folderId: string | null;
}): Promise<void> {
  await clientApi.patch(`/api/me/library/papers/${libraryPaperId}`, {
    folderId,
  });
}

export async function removeLibraryPaper(
  libraryPaperId: string,
): Promise<void> {
  await clientApi.delete(`/api/me/library/papers/${libraryPaperId}`);
}
