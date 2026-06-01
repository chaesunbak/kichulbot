'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderInput, Play, Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import type { LibraryFolder } from '@/features/learning/types';

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
    const response = await fetch('/api/me/solve-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId, mode }),
    });
    if (!response.ok) {
      setIsStarting(false);
      setMessage('풀이를 시작하지 못했습니다.');
      return;
    }
    const body = (await response.json()) as { session: { id: string } };
    router.push(`/solve/${body.session.id}`);
  };

  const move = async () => {
    const nextFolderId = folderId === ROOT_FOLDER_VALUE ? null : folderId;
    setIsMoving(true);
    setMessage(null);
    const response = await fetch(`/api/me/library/papers/${libraryPaperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: nextFolderId }),
    });
    setIsMoving(false);
    if (!response.ok) {
      setMessage('문제지를 이동하지 못했습니다.');
      return;
    }
    setMessage('문제지를 이동했습니다.');
    router.refresh();
  };

  const remove = async () => {
    if (!window.confirm('내 서재에서 이 저장 항목을 제거할까요?')) return;
    setIsDeleting(true);
    setMessage(null);
    const response = await fetch(`/api/me/library/papers/${libraryPaperId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setIsDeleting(false);
      setMessage('문제지를 제거하지 못했습니다.');
      return;
    }
    router.push('/library');
    router.refresh();
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
