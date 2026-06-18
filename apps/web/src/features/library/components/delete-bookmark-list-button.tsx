'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';

import type { BookmarkListSummary } from '@/features/learning/types';
import { deleteBookmarkList as deleteBookmarkListApi } from '@/features/library/api/client/mutations';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';

type DeleteBookmarkListButtonProps = {
  bookmarkList: Pick<BookmarkListSummary, 'id' | 'name'>;
  disabled?: boolean;
  onDeletingChange: (isDeleting: boolean) => void;
};

export function DeleteBookmarkListButton({
  bookmarkList,
  disabled = false,
  onDeletingChange,
}: DeleteBookmarkListButtonProps) {
  const router = useRouter();

  const deleteBookmarkList = async () => {
    const shouldDelete = await overlay.openAsync<boolean>(
      ({ isOpen, close, unmount }) => (
        <ConfirmDialog
          isOpen={isOpen}
          title={`"${bookmarkList.name}" 북마크 리스트를 삭제할까요?`}
          description="포함된 문제도 북마크 목록에서 함께 제거됩니다."
          confirmLabel="삭제"
          destructive
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          onExit={unmount}
        />
      ),
    );
    if (!shouldDelete) return;

    onDeletingChange(true);
    try {
      await deleteBookmarkListApi(bookmarkList.id);
      router.push('/library');
      router.refresh();
    } catch {
      toast.error('북마크 리스트를 삭제하지 못했습니다.');
      onDeletingChange(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={disabled}
      onClick={() => void deleteBookmarkList()}
    >
      <Trash2 />
      삭제
    </Button>
  );
}
