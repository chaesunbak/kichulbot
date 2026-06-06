'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { FolderInput, Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import posthog from 'posthog-js';
import { useState } from 'react';

import { createSolveSession } from '@/features/learning/api/client';
import type { LibraryFolder } from '@/features/learning/types';
import {
  moveLibraryPaper,
  removeLibraryPaper,
} from '@/features/library/api/client';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';

const ROOT_FOLDER_VALUE = '__root__';

export function LibraryPaperActions({
  libraryPaperId,
  paperId,
  questionCount,
  folders,
  initialFolderId,
}: {
  libraryPaperId: string;
  paperId: string;
  questionCount?: number;
  folders: LibraryFolder[];
  initialFolderId: string | null;
}) {
  const router = useRouter();
  const [folderId, setFolderId] = useState(
    initialFolderId ?? ROOT_FOLDER_VALUE,
  );
  const [nextFolderId, setNextFolderId] = useState(folderId);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const start = async (mode: 'ONE_BY_ONE' | 'EXAM') => {
    setIsStarting(true);
    try {
      const session = await createSolveSession({ paperId, mode });
      posthog.capture('solve_session_started', {
        session_id: session.id,
        paper_id: paperId,
        mode,
        question_count: questionCount,
        authenticated: true,
        source: 'library',
      });
      router.push(`/solve/${session.id}`);
    } catch {
      toast.error('풀이를 시작하지 못했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const move = async () => {
    const targetFolderId =
      nextFolderId === ROOT_FOLDER_VALUE ? null : nextFolderId;
    setIsMoving(true);
    try {
      await moveLibraryPaper({
        libraryPaperId,
        folderId: targetFolderId,
      });
      setFolderId(nextFolderId);
      setIsMoveDialogOpen(false);
      toast.success('문제지를 이동했습니다.');
      router.refresh();
    } catch {
      toast.error('문제지를 이동하지 못했습니다.');
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
    try {
      await removeLibraryPaper(libraryPaperId);
      toast.success('문제지를 제거했습니다.');
      router.push('/library');
      router.refresh();
    } catch {
      toast.error('문제지를 제거하지 못했습니다.');
    } finally {
      setIsDeleting(false);
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
          <Play />
          연습모드
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isStarting || isDeleting || isMoving}
          onClick={() => start('EXAM')}
        >
          <Play />
          시험모드
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isStarting || isMoving || isDeleting}
          onClick={() => {
            setNextFolderId(folderId);
            setIsMoveDialogOpen(true);
          }}
        >
          <FolderInput />
          {isMoving ? '이동 중' : '폴더 이동'}
        </Button>
      </div>
      <Dialog
        open={isMoveDialogOpen}
        onOpenChange={(open) => {
          if (isMoving) return;
          setIsMoveDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={!isMoving}>
          <form
            className="grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              void move();
            }}
          >
            <DialogHeader>
              <DialogTitle>어느 폴더로 이동할까요?</DialogTitle>
              <DialogDescription>
                문제지를 옮길 폴더를 선택해 주세요.
              </DialogDescription>
            </DialogHeader>
            <Select
              value={nextFolderId}
              disabled={isMoving}
              onValueChange={setNextFolderId}
            >
              <SelectTrigger aria-label="이동할 폴더 선택" className="w-full">
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isMoving}
                onClick={() => setIsMoveDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isMoving}>
                {isMoving ? '이동 중' : '이동'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
