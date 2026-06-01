import { clientApi } from '@/shared/api/client';

export async function addExamPaperToLibrary(
  paperId: string,
  folderId: string | null,
): Promise<void> {
  await clientApi.put(`/api/me/library/exam-papers/${paperId}`, { folderId });
}
