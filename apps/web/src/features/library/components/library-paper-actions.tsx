'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderInput, Play, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import type { LibraryFolder } from '@/features/learning/types';
import { createSolveSession } from '@/features/learning/api/client';
import {
  moveLibraryPaper,
  removeLibraryPaper,
} from '@/features/library/api/client';

const ROOT_FOLDER_VALUE = '__root__';

export function LibraryPaperActions({
  libraryPaperId,
  paperId,
  folders,
  initialFolderId,
}: {
  libraryPaperId: string;
  paperId: string;
  folders: LibraryFolder[];
  initialFolderId: string | null;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(
    initialFolderId ?? ROOT_FOLDER_VALUE,
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const start = async (mode: 'ONE_BY_ONE' | 'EXAM') => {
    setIsStarting(true);
    setMessage(null);
    try {
      const session = await createSolveSession({ paperId, mode });
      router.push(`/solve/${session.id}`);
    } catch {
      setIsStarting(false);
      setMessage('풀이를 시작하지 못했습니다.');
    }
  };

  const move = async () => {
    const nextFolderId = folderId === ROOT_FOLDER_VALUE ? null : folderId;
    setIsMoving(true);
    setMessage(null);
    try {
      await moveLibraryPaper({
        libraryPaperId,
        folderId: nextFolderId,
      });
      setMessage('문제지를 이동했습니다.');
      router.refresh();
    } catch {
      setMessage('문제지를 이동하지 못했습니다.');
    } finally {
      setIsMoving(false);
    }
  };

  const remove = async () => {
    const shouldDelete = await overlay.openAsync<boolean>(
      ({ isOpen, close, unmount }) => (
        <ConfirmDialog
          isOpen={isOpen}
          title="내 서재에서 제거할까요?"
          description="저장 항목만 제거되며 문제지는 그대로 유지됩니다."
          confirmLabel="제거"
          destructive
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          onExit={unmount}
        />
      ),
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setMessage(null);
    try {
      await removeLibraryPaper(libraryPaperId);
      router.push('/library');
      router.refresh();
    } catch {
      setIsDeleting(false);
      setMessage('문제지를 제거하지 못했습니다.');
    }
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isStarting || isDeleting || isMoving}
          onClick={() => start('ONE_BY_ONE')}
        >
          <Play />한 문제씩 풀기
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isStarting || isDeleting || isMoving}
          onClick={() => start('EXAM')}
        >
          <Play />
          한번에 풀기
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isStarting || isDeleting || isMoving}
          onClick={remove}
        >
          <Trash2 />
          {isDeleting ? '제거 중' : '내 서재에서 제거'}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 rounded-lg bg-zinc-50 p-3">
        <Select value={folderId} onValueChange={setFolderId}>
          <SelectTrigger aria-label="이동할 폴더 선택">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROOT_FOLDER_VALUE}>루트</SelectItem>
            {flattenFolders(folders).map(({ folder, depth }) => (
              <SelectItem key={folder.id} value={folder.id}>
                {`${'  '.repeat(depth)}${folder.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isMoving || isDeleting}
          onClick={move}
        >
          <FolderInput />
          {isMoving ? '이동 중' : '이동'}
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}
    </div>
  );
}

function flattenFolders(folders: LibraryFolder[]) {
  const childrenByParent = new Map<string | null, LibraryFolder[]>();
  folders.forEach((folder) => {
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parentId, siblings);
  });
  childrenByParent.forEach((siblings) => {
    siblings.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.name.localeCompare(b.name),
    );
  });

  const flattened: Array<{ folder: LibraryFolder; depth: number }> = [];
  const visit = (parentId: string | null, depth: number) => {
    (childrenByParent.get(parentId) ?? []).forEach((folder) => {
      flattened.push({ folder, depth });
      visit(folder.id, depth + 1);
    });
  };
  visit(null, 0);
  return flattened;
}
