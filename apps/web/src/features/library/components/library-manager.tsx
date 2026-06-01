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
  Folder,
  FolderPlus,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
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
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { PromptDialog } from '@/shared/components/prompt-dialog';
import { cn } from '@/shared/lib/utils';

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
    <section className="mt-7">
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

        <div className="flex shrink-0 items-center gap-1.5 pt-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="폴더 만들기"
            onClick={createFolder}
          >
            <Plus className="size-5" />
          </Button>
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

      <div className="mt-7 flex items-center justify-between gap-3">
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
        <section
          className="
            mt-8 rounded-2xl border border-zinc-200 px-4 py-14 text-center
          "
        >
          <Folder className="mx-auto size-12 text-sky-300" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900">
            비어 있습니다
          </h3>
        </section>
      ) : (
        <ul
          className="
            mt-8 grid gap-4
            md:grid-cols-2
            xl:grid-cols-3
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
            <PaperCard key={libraryPaper.id} libraryPaper={libraryPaper} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FolderCard({
  folder,
  count,
  onOpen,
}: {
  folder: LibraryFolder;
  count: number;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="
          flex min-h-40 w-full items-center gap-5 rounded-2xl border bg-white
          p-6 text-left transition
          hover:border-sky-200 hover:bg-sky-50/40
          md:min-h-56 md:flex-col md:items-center md:justify-center
          md:text-center
        "
        onClick={onOpen}
      >
        <span
          className="
            relative flex h-20 w-24 shrink-0 items-end
            md:h-24 md:w-32
          "
        >
          <span className="
            absolute top-2 left-1 h-5 w-10 rounded-t-xl bg-sky-400
          " />
          <span
            className="
              relative h-16 w-24 rounded-xl bg-sky-300 shadow-sm
              md:h-20 md:w-32
            "
          />
        </span>
        <span
          className="
            min-w-0 flex-1
            md:flex-none
          "
        >
          <span
            className="
              block truncate text-2xl font-semibold text-zinc-950
              md:text-xl
            "
          >
            {folder.name}
          </span>
          <span
            className="
              mt-4 block text-xl text-zinc-400
              md:text-lg
            "
          >
            {count}개
          </span>
        </span>
      </button>
    </li>
  );
}

function PaperCard({ libraryPaper }: { libraryPaper: LibraryPaper }) {
  const { paper } = libraryPaper;

  return (
    <li>
      <Link
        href={`/library/papers/${libraryPaper.id}`}
        className={cn(
          `
            flex min-h-40 gap-5 rounded-2xl border p-5 transition
            hover:border-zinc-300 hover:bg-zinc-50
          `,
          'md:min-h-56 md:flex-col md:gap-4',
        )}
        aria-label={`${paper.title} 자세히 보기`}
      >
        <PaperCover
          paper={paper}
          className="
            w-24 shrink-0 rounded-none
            md:mx-auto md:w-full md:max-w-32
          "
        />
        <div
          className="
            flex min-w-0 flex-1 flex-col
            md:flex-none
          "
        >
          <h3
            className="
              line-clamp-2 text-2xl/tight font-medium break-keep text-zinc-950
              md:text-lg
            "
          >
            {paper.title}
          </h3>
          <p
            className="
              mt-3 truncate text-lg text-zinc-400
              md:text-sm
            "
          >
            {paper.exam.name}
          </p>
          <div
            className="
              mt-auto flex items-end justify-between gap-3 pt-6 text-lg
              text-zinc-400
              md:text-sm
            "
          >
            <span>{formatQuestionCount(paper.questionCount)}</span>
            <span>{formatRelativeTime(libraryPaper.createdAt)} 추가</span>
          </div>
        </div>
      </Link>
    </li>
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

function formatQuestionCount(count: number) {
  return `${count}문항`;
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  return `${Math.floor(diffMs / day)}일 전`;
}
