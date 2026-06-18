'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Pencil } from 'lucide-react';
import { overlay } from 'overlay-kit';

import type { BookmarkListSummary } from '@/features/learning/types';
import { renameBookmarkList as renameBookmarkListApi } from '@/features/library/api/client/mutations';
import { PromptDialog } from '@/shared/components/prompt-dialog';

type RenameBookmarkListButtonProps = {
  bookmarkList: Pick<BookmarkListSummary, 'id' | 'name'>;
  disabled?: boolean;
  onRenamed: (bookmarkList: BookmarkListSummary) => void;
};

export function RenameBookmarkListButton({
  bookmarkList,
  disabled = false,
  onRenamed,
}: RenameBookmarkListButtonProps) {
  const renameBookmarkList = async () => {
    const name = await overlay.openAsync<string | null>(
      ({ isOpen, close, unmount }) => (
        <PromptDialog
          isOpen={isOpen}
          title="북마크 리스트 이름 변경"
          description="변경할 북마크 리스트 이름을 입력해 주세요."
          defaultValue={bookmarkList.name}
          confirmLabel="변경"
          onCancel={() => close(null)}
          onConfirm={(value) => close(value)}
          onExit={unmount}
        />
      ),
    );
    if (!name?.trim() || name.trim() === bookmarkList.name) return;

    try {
      const updated = await renameBookmarkListApi({
        bookmarkListId: bookmarkList.id,
        name,
      });
      onRenamed(updated);
    } catch {
      toast.error('북마크 리스트 이름을 바꾸지 못했습니다.');
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => void renameBookmarkList()}
    >
      <Pencil />
      이름 변경
    </Button>
  );
}
