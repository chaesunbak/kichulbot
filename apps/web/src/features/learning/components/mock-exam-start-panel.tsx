'use client';

import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import posthog from 'posthog-js';
import { useMemo, useState } from 'react';

import type { Exam } from '@/features/exams/types';
import { createMockExamSolveSession } from '@/features/learning/api/client/mutations';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import { createLocalMockExamSolveSession } from '@/features/learning/lib/local-solve-session';
import type { SolveMode } from '@/features/learning/types';

export function MockExamStartPanel({
  exams,
  isAuthenticated,
}: {
  exams: Exam[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const availableExams = useMemo(
    () => exams.filter((exam) => exam.isMockExamAvailable),
    [exams],
  );
  const [startingExamId, setStartingExamId] = useState<string | null>(null);

  const chooseMode = async (exam: Exam) => {
    const mode = await overlay.openAsync<SolveMode | null>(
      ({ isOpen, close, unmount }) => (
        <SolveModeDialog
          isOpen={isOpen}
          onCancel={() => close(null)}
          onSelect={(selectedMode) => close(selectedMode)}
          onExit={unmount}
        />
      ),
    );
    if (!mode) return;

    await start(exam, mode);
  };

  async function start(exam: Exam, mode: SolveMode) {
    setStartingExamId(exam.id);
    try {
      const { session, generation } = isAuthenticated
        ? await createMockExamSolveSession({
            examId: exam.id,
            mode,
          })
        : await createLocalMockExamSolveSession({
            examId: exam.id,
            mode,
          });
      posthog.capture('mock_exam_started', {
        session_id: session.id,
        exam_id: exam.id,
        mode,
        supplemented: generation.supplemented,
        source: 'mock_exam_page',
        authenticated: isAuthenticated,
      });
      router.push(
        isAuthenticated ? `/solve/${session.id}` : `/solve/local/${session.id}`,
      );
    } catch (error) {
      setStartingExamId(null);
      toast.error(
        error instanceof Error
          ? error.message
          : '모의고사를 생성하지 못했습니다.',
      );
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-5">
        {availableExams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            아직 생성 가능한 모의고사가 없습니다.
          </p>
        ) : (
          <>
            <ul className="grid gap-2">
              {availableExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    className="
                      flex min-h-18 w-full items-center justify-between gap-3
                      rounded-lg border bg-card p-4 text-left transition
                      hover:bg-muted
                      focus-visible:ring-2 focus-visible:ring-primary
                      focus-visible:ring-offset-2 focus-visible:outline-none
                      disabled:cursor-not-allowed disabled:opacity-70
                    "
                    disabled={startingExamId !== null}
                    onClick={() => void chooseMode(exam)}
                  >
                    <span className="grid min-w-0 gap-1">
                      <span className="truncate text-sm font-medium text-foreground">
                        {exam.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {formatExamCategories(exam)}
                      </span>
                    </span>
                    <span
                      className="
                        flex shrink-0 items-center gap-1 text-xs font-medium
                        text-muted-foreground
                      "
                    >
                      {startingExamId === exam.id ? '준비 중' : '선택'}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatExamCategories(exam: Exam) {
  if (exam.categories.length === 0) return '분류 없음';

  return exam.categories.map((category) => category.name).join(', ');
}
