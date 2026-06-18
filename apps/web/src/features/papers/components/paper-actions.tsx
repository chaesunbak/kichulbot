import { AddToLibraryButton } from '@/features/papers/components/add-to-library-button';
import { PaperSolveButton } from '@/features/papers/components/paper-solve-button';

export function PaperActions({
  paperId,
  questionCount,
  initialIsInLibrary = false,
  isAuthenticated = false,
}: {
  paperId: string;
  questionCount?: number;
  initialIsInLibrary?: boolean;
  isAuthenticated?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <PaperSolveButton
        paperId={paperId}
        questionCount={questionCount}
        isAuthenticated={isAuthenticated}
      />
      <AddToLibraryButton
        paperId={paperId}
        initialIsInLibrary={initialIsInLibrary}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
