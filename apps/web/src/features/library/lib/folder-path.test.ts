import { describe, expect, it } from 'vitest';

import type { LibraryFolder } from '@/features/learning/types';
import { getLibraryFolderPath } from '@/features/library/lib/folder-path';

function folder(
  id: string,
  name: string,
  parentId: string | null,
): LibraryFolder {
  return {
    id,
    name,
    parentId,
    sortOrder: 0,
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
  };
}

describe('getLibraryFolderPath', () => {
  it('선택한 폴더까지의 전체 경로를 반환한다', () => {
    expect(
      getLibraryFolderPath(
        [
          folder('folder-1', '한국사', null),
          folder('folder-2', '근현대사', 'folder-1'),
          folder('folder-3', '일제강점기', 'folder-2'),
        ],
        'folder-3',
      ),
    ).toBe('한국사 / 근현대사 / 일제강점기');
  });

  it('폴더가 없거나 찾을 수 없으면 루트를 반환한다', () => {
    expect(getLibraryFolderPath([], null)).toBe('루트');
    expect(
      getLibraryFolderPath([folder('folder-1', '한국사', null)], 'missing'),
    ).toBe('루트');
  });
});
