'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookCheck, BookPlus, FolderPlus, Play } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import type { Library, LibraryFolder } from '@/features/learning/types';

const ROOT_FOLDER_VALUE = '__root__';

export function PaperActions({
  paperId,
  initialIsInLibrary = false,
}: {
  paperId: string;
  initialIsInLibrary?: boolean;
}) {
  const router = useRouter();
  const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isChoosingFolder, setIsChoosingFolder] = useState(false);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [folderId, setFolderId] = useState(ROOT_FOLDER_VALUE);
  const [isStarting, setIsStarting] = useState(false);
  const [isChoosingMode, setIsChoosingMode] = useState(false);

  const loadFolders = async () => {
    const response = await fetch('/api/me/library');
    if (!response.ok) {
      setMessage('폴더 목록을 불러오지 못했습니다.');
      return false;
    }
    const body = (await response.json()) as Library;
    setFolders(body.folders);
    return true;
  };

  const toggleFolderPicker = async () => {
    if (isChoosingFolder) return setIsChoosingFolder(false);
    setMessage(null);
    const loaded = await loadFolders();
    if (loaded) setIsChoosingFolder(true);
  };

  const addToLibrary = async (targetFolderId: string | null) => {
    setIsAdding(true);
    setMessage(null);
    const response = await fetch(`/api/me/library/exam-papers/${paperId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: targetFolderId }),
    });
    setIsAdding(false);
    if (response.ok) {
      setIsInLibrary(true);
      setIsChoosingFolder(false);
      setMessage(
        targetFolderId
          ? '선택한 폴더에 추가했습니다.'
          : '내 서재에 추가했습니다.',
      );
      router.refresh();
    } else {
      setMessage('내 서재 추가에 실패했습니다.');
    }
  };

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

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isAdding}
          onClick={() => addToLibrary(null)}
        >
          {isInLibrary ? <BookCheck /> : <BookPlus />}
          {isAdding ? '추가 중' : '내 서재에 추가'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isAdding}
          onClick={toggleFolderPicker}
        >
          <FolderPlus />
          폴더 선택
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isStarting}
          onClick={() => setIsChoosingMode((current) => !current)}
        >
          <Play />
          {isStarting ? '준비 중' : '풀기'}
        </Button>
      </div>
      {isChoosingFolder && !isAdding && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-lg bg-zinc-50 p-3">
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger aria-label="추가할 폴더 선택">
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
            size="sm"
            onClick={() =>
              addToLibrary(folderId === ROOT_FOLDER_VALUE ? null : folderId)
            }
          >
            추가
          </Button>
        </div>
      )}
      {isChoosingMode && !isStarting && (
        <div className="mt-3 grid gap-2 rounded-lg bg-zinc-50 p-3 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => start('ONE_BY_ONE')}
          >
            한 문제씩 풀기
          </Button>
          <p className="text-zinc-500">
            문제를 푼 직후 정답과 해설을 확인합니다.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => start('EXAM')}
          >
            한번에 풀기
          </Button>
          <p className="text-zinc-500">
            시험 종료 후 결과와 해설을 확인합니다.
          </p>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}
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
