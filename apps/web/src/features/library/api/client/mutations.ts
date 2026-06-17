import type {
  BookmarkListSummary,
  LibraryFolder,
} from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

export async function createBookmarkList(
  name: string,
): Promise<BookmarkListSummary> {
  const res = await clientApi.post<{
    data: { bookmarkList: BookmarkListSummary };
  }>('/api/me/question-lists', { name });
  return res.data.bookmarkList;
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
  const res = await clientApi.post<{ data: { folder: LibraryFolder } }>(
    '/api/me/library/folders',
    { name, parentId },
  );
  return res.data.folder;
}

export async function renameLibraryFolder({
  folderId,
  name,
}: {
  folderId: string;
  name: string;
}): Promise<LibraryFolder> {
  const res = await clientApi.patch<{ data: { folder: LibraryFolder } }>(
    `/api/me/library/folders/${folderId}`,
    { name },
  );
  return res.data.folder;
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
