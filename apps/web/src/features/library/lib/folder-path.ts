import type { LibraryFolder } from '@/features/learning/types';

export function getLibraryFolderPath(
  folders: LibraryFolder[],
  folderId: string | null,
) {
  if (!folderId) return '루트';

  const names: string[] = [];
  let current = folders.find((folder) => folder.id === folderId);

  while (current) {
    names.unshift(current.name);
    current = folders.find((folder) => folder.id === current?.parentId);
  }

  return names.length > 0 ? names.join(' / ') : '루트';
}
