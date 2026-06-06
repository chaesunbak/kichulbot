import { PaperBookmarkButton } from '@/features/papers/components/paper-bookmark-button';
import { PaperSolveButton } from '@/features/papers/components/paper-solve-button';

export function PaperActions({
  paperId,
  initialIsInLibrary = false,
  isAuthenticated = false,
}: {
  paperId: string;
  initialIsInLibrary?: boolean;
  isAuthenticated?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <PaperSolveButton paperId={paperId} isAuthenticated={isAuthenticated} />
      <PaperBookmarkButton
        paperId={paperId}
        initialIsInLibrary={initialIsInLibrary}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
