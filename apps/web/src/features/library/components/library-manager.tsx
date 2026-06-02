'use client';

import { Button } from '@kichulbot/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kichulbot/ui/components/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import {
  ChevronLeft,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useMemo, useState } from 'react';

import type {
  Library,
  LibraryFolder,
  LibraryPaper,
} from '@/features/learning/types';
import {
  createLibraryFolder,
  deleteLibraryFolder,
  renameLibraryFolder,
} from '@/features/library/api/client';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { PromptDialog } from '@/shared/components/prompt-dialog';

import { FileCard } from './file-card';
import { FolderCard } from './folder-card';

const SORT_OPTIONS = {
  recent: '최근 추가순',
  oldest: '오래된순',
  title: '이름순',
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

export function LibraryManager({
  initialLibrary,
}: {
  initialLibrary: Library;
}) {
  const [folders, setFolders] = useState(initialLibrary.folders);
  const [papers] = useState(initialLibrary.papers);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [message, setMessage] = useState<string | null>(null);
  const selectedFolder = folders.find(
    (folder) => folder.id === selectedFolderId,
  );
  const childrenByParent = useMemo(() => groupFolders(folders), [folders]);
  const visibleFolders = childrenByParent.get(selectedFolderId) ?? [];
  const visiblePapers = useMemo(
    () =>
      sortPapers(
        papers.filter((paper) => paper.folderId === selectedFolderId),
        sortKey,
      ),
    [papers, selectedFolderId, sortKey],
  );
  const parentFolderId = selectedFolder?.parentId ?? null;
  const title = selectedFolder?.name ?? '책장';
  const isEmpty = visibleFolders.length === 0 && visiblePapers.length === 0;

  const createFolder = async () => {
    const name = await overlay.openAsync<string | null>(
      ({ isOpen, close, unmount }) => (
        <PromptDialog
          isOpen={isOpen}
          title="새 폴더"
          description="새 폴더 이름을 입력해 주세요."
          placeholder="폴더 이름"
          confirmLabel="만들기"
          onCancel={() => close(null)}
          onConfirm={(value) => close(value)}
          onExit={unmount}
        />
      ),
    );
    if (!name?.trim()) return;
    try {
      const folder = await createLibraryFolder({
        name,
        parentId: selectedFolderId,
      });
      setFolders((current) => [...current, folder]);
      setSelectedFolderId(folder.id);
      setMessage('새 폴더를 만들었습니다.');
    } catch {
      setMessage('폴더를 만들지 못했습니다.');
    }
  };

  const renameFolder = async () => {
    if (!selectedFolder) return;
    const name = await overlay.openAsync<string | null>(
      ({ isOpen, close, unmount }) => (
        <PromptDialog
          isOpen={isOpen}
          title="폴더 이름 변경"
          description="변경할 폴더 이름을 입력해 주세요."
          defaultValue={selectedFolder.name}
          confirmLabel="변경"
          onCancel={() => close(null)}
          onConfirm={(value) => close(value)}
          onExit={unmount}
        />
      ),
    );
    if (!name?.trim() || name.trim() === selectedFolder.name) return;
    try {
      const folder = await renameLibraryFolder({
        folderId: selectedFolder.id,
        name,
      });
      setFolders((current) =>
        current.map((item) => (item.id === folder.id ? folder : item)),
      );
      setMessage('폴더 이름을 바꿨습니다.');
    } catch {
      setMessage('폴더 이름을 바꾸지 못했습니다.');
    }
  };

  const deleteFolder = async () => {
    if (!selectedFolder) return;
    const shouldDelete = await overlay.openAsync<boolean>(
      ({ isOpen, close, unmount }) => (
        <ConfirmDialog
          isOpen={isOpen}
          title={`"${selectedFolder.name}" 폴더를 삭제할까요?`}
          description="비어 있는 폴더만 삭제할 수 있습니다."
          confirmLabel="삭제"
          destructive
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          onExit={unmount}
        />
      ),
    );
    if (!shouldDelete) return;

    try {
      await deleteLibraryFolder(selectedFolder.id);
      setFolders((current) =>
        current.filter((folder) => folder.id !== selectedFolder.id),
      );
      setSelectedFolderId(parentFolderId);
      setMessage('폴더를 삭제했습니다.');
    } catch {
      setMessage('비어 있는 폴더만 삭제할 수 있습니다.');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
          {selectedFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-1 -ml-2 text-zinc-500"
              onClick={() => setSelectedFolderId(parentFolderId)}
            >
              <ChevronLeft />
              이전
            </Button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="현재 폴더 메뉴">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={createFolder}>
                <FolderPlus />새 폴더
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!selectedFolder}
                onSelect={renameFolder}
              >
                <Pencil />
                이름 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!selectedFolder}
                variant="destructive"
                onSelect={deleteFolder}
              >
                <Trash2 />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as SortKey)}
        >
          <SelectTrigger aria-label="정렬 기준" className="h-12 min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="shrink-0 text-sm font-medium text-zinc-400">
          {visibleFolders.length + visiblePapers.length}개
        </p>
      </div>

      {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}

      {isEmpty ? (
        <section className="rounded-2xl border px-4 py-14 text-center">
          <div className="text-lg text-zinc-800">비어 있습니다</div>
        </section>
      ) : (
        <ul
          className="
            grid gap-4
            md:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {visibleFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              count={getDirectItemCount(folder.id, childrenByParent, papers)}
              onOpen={() => setSelectedFolderId(folder.id)}
            />
          ))}
          {visiblePapers.map((libraryPaper) => (
            <FileCard key={libraryPaper.id} libraryPaper={libraryPaper} />
          ))}
        </ul>
      )}
    </section>
  );
}

function groupFolders(folders: LibraryFolder[]) {
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
  return childrenByParent;
}

function sortPapers(papers: LibraryPaper[], sortKey: SortKey) {
  return [...papers].sort((a, b) => {
    if (sortKey === 'oldest') return a.createdAt.localeCompare(b.createdAt);
    if (sortKey === 'title') {
      return a.paper.title.localeCompare(b.paper.title, 'ko');
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function getDirectItemCount(
  folderId: string,
  childrenByParent: Map<string | null, LibraryFolder[]>,
  papers: LibraryPaper[],
) {
  return (
    (childrenByParent.get(folderId)?.length ?? 0) +
    papers.filter((paper) => paper.folderId === folderId).length
  );
}
