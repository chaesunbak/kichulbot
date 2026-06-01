'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  BookshelfGrid,
  BookshelfSection,
} from '@/features/library/components/bookshelf-section';
import { PaperCoverCard } from '@/features/papers/components/paper-cover-card';
import type {
  Library,
  LibraryFolder,
  LibraryPaper,
} from '@/features/learning/types';

export function LibraryManager({
  initialLibrary,
}: {
  initialLibrary: Library;
}) {
  const [folders, setFolders] = useState(initialLibrary.folders);
  const [papers] = useState(initialLibrary.papers);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selectedFolder = folders.find(
    (folder) => folder.id === selectedFolderId,
  );
  const visiblePapers = papers.filter(
    (paper) => paper.folderId === selectedFolderId,
  );
  const title = selectedFolder?.name ?? '루트';
  const folderChildren = useMemo(() => groupFolders(folders), [folders]);

  const createFolder = async () => {
    const name = window.prompt('새 폴더 이름을 입력해 주세요.');
    if (!name?.trim()) return;
    const response = await fetch('/api/me/library/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId: selectedFolderId }),
    });
    if (!response.ok) return setMessage('폴더를 만들지 못했습니다.');
    const body = (await response.json()) as { folder: LibraryFolder };
    setFolders((current) => [...current, body.folder]);
    setSelectedFolderId(body.folder.id);
    setMessage('새 폴더를 만들었습니다.');
  };

  const renameFolder = async () => {
    if (!selectedFolder) return;
    const name = window.prompt(
      '변경할 폴더 이름을 입력해 주세요.',
      selectedFolder.name,
    );
    if (!name?.trim() || name.trim() === selectedFolder.name) return;
    const response = await fetch(
      `/api/me/library/folders/${selectedFolder.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      },
    );
    if (!response.ok) return setMessage('폴더 이름을 바꾸지 못했습니다.');
    const body = (await response.json()) as { folder: LibraryFolder };
    setFolders((current) =>
      current.map((folder) =>
        folder.id === body.folder.id ? body.folder : folder,
      ),
    );
    setMessage('폴더 이름을 바꿨습니다.');
  };

  const deleteFolder = async () => {
    if (!selectedFolder) return;
    if (!window.confirm(`"${selectedFolder.name}" 폴더를 삭제할까요?`)) return;
    const response = await fetch(
      `/api/me/library/folders/${selectedFolder.id}`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      return setMessage('비어 있는 폴더만 삭제할 수 있습니다.');
    }
    setFolders((current) =>
      current.filter((folder) => folder.id !== selectedFolder.id),
    );
    setSelectedFolderId(selectedFolder.parentId);
    setMessage('폴더를 삭제했습니다.');
  };

  return (
    <section className="mt-7 grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-xl border bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">폴더</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="폴더 만들기"
            onClick={createFolder}
          >
            <FolderPlus />
          </Button>
        </div>
        <div className="mt-3 grid gap-1">
          <FolderButton
            label="루트"
            selected={selectedFolderId === null}
            depth={0}
            count={papers.filter((paper) => paper.folderId === null).length}
            onClick={() => setSelectedFolderId(null)}
          />
          <FolderTree
            folders={folderChildren.get(null) ?? []}
            childrenByParent={folderChildren}
            selectedFolderId={selectedFolderId}
            papers={papers}
            onSelect={setSelectedFolderId}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={createFolder}
          >
            <FolderPlus />새 폴더
          </Button>
          {selectedFolder && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={renameFolder}
              >
                <Pencil />
                이름 변경
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteFolder}
              >
                <Trash2 />
                삭제
              </Button>
            </>
          )}
        </div>
        {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}

        {visiblePapers.length === 0 ? (
          <section className="mt-5 rounded-xl border border-dashed px-4 py-10 text-center">
            <Folder className="mx-auto size-8 text-zinc-300" />
            <h2 className="mt-3 font-semibold text-zinc-800">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              이 위치에 저장한 문제지가 없습니다.
            </p>
          </section>
        ) : (
          <BookshelfSection
            title={title}
            countLabel={`${visiblePapers.length}권`}
          >
            <BookshelfGrid>
              {visiblePapers.map((libraryPaper) => (
                <li key={libraryPaper.id} className="min-w-0 px-1 pb-5">
                  <Link
                    href={`/library/papers/${libraryPaper.id}`}
                    className="block min-w-0 rounded-lg"
                    aria-label={`${libraryPaper.paper.title} 자세히 보기`}
                  >
                    <PaperCoverCard paper={libraryPaper.paper} />
                  </Link>
                </li>
              ))}
            </BookshelfGrid>
          </BookshelfSection>
        )}
      </div>
    </section>
  );
}

function FolderTree({
  folders,
  childrenByParent,
  selectedFolderId,
  papers,
  onSelect,
  depth = 0,
}: {
  folders: LibraryFolder[];
  childrenByParent: Map<string | null, LibraryFolder[]>;
  selectedFolderId: string | null;
  papers: LibraryPaper[];
  onSelect: (folderId: string | null) => void;
  depth?: number;
}) {
  return folders.map((folder) => (
    <div key={folder.id}>
      <FolderButton
        label={folder.name}
        selected={selectedFolderId === folder.id}
        depth={depth}
        count={papers.filter((paper) => paper.folderId === folder.id).length}
        onClick={() => onSelect(folder.id)}
      />
      <FolderTree
        folders={childrenByParent.get(folder.id) ?? []}
        childrenByParent={childrenByParent}
        selectedFolderId={selectedFolderId}
        papers={papers}
        onSelect={onSelect}
        depth={depth + 1}
      />
    </div>
  ));
}

function FolderButton({
  label,
  selected,
  depth,
  count,
  onClick,
}: {
  label: string;
  selected: boolean;
  depth: number;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm ${
        selected ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-100'
      }`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
      onClick={onClick}
    >
      <Folder className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
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
