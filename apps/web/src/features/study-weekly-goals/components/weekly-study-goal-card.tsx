import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import { Check, X } from 'lucide-react';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  countSolvedDatesInWeek,
  getSolvedDates,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { WeeklyStudyGoalSetterButton } from '@/features/study-weekly-goals/components/weekly-study-goal-setter-button';
import type { StudyWeeklyGoal } from '@/features/study-weekly-goals/types';
import { cn } from '@/shared/lib/utils';

interface WeeklyStudyGoalCardProps {
  goal: StudyWeeklyGoal;
  questionAttempts: QuestionAttempt[];
}

export function WeeklyStudyGoalCard({
  goal,
  questionAttempts,
}: WeeklyStudyGoalCardProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = getSolvedDates(questionAttempts);
  const achievedDays = countSolvedDatesInWeek(currentWeek.week, solvedDates);

  return (
    <Card className="rounded-3xl">
      <CardContent className="space-y-5 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="shrink-0 text-base font-bold text-foreground sm:text-lg">
              주 학습일
            </h2>
            <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-muted-foreground sm:px-3 sm:text-xs">
              {achievedDays}일차 완료
            </span>
          </div>
          {goal.isConfigured ? (
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap text-foreground sm:px-3 sm:text-sm">
              목표 {goal.targetDays}일
            </span>
          ) : (
            <WeeklyStudyGoalSetterButton defaultTargetDays={goal.targetDays} />
          )}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {currentWeek.week.map(({ label, date }, index) => {
            const isSolved = solvedDates.has(date);
            const isFuture = date > currentWeek.today;
            const nextDate = currentWeek.week[index + 1]?.date;
            const hasNextSolvedDate = nextDate
              ? solvedDates.has(nextDate)
              : false;

            return (
              <div
                key={date}
                className="relative flex min-w-0 flex-col items-center gap-3"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
                <div className="relative flex h-10 w-full items-center justify-center sm:h-14">
                  {isSolved && hasNextSolvedDate ? (
                    <div className="absolute inset-y-0 left-1/2 w-[calc(100%+0.125rem)] bg-blue-100 sm:w-[calc(100%+0.25rem)]" />
                  ) : null}
                  <WeeklyStudyDayMarker
                    isFuture={isFuture}
                    isSolved={isSolved}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyStudyDayMarkerProps {
  isFuture: boolean;
  isSolved: boolean;
}

function WeeklyStudyDayMarker({
  isFuture,
  isSolved,
}: WeeklyStudyDayMarkerProps) {
  if (isSolved) {
    return (
      <div className="relative z-10 flex size-10 items-center justify-center rounded-full bg-blue-500 text-white sm:size-14">
        <Check className="size-7 stroke-3 sm:size-8" />
      </div>
    );
  }

  if (isFuture) {
    return (
      <div className="relative z-10 flex size-10 items-center justify-center sm:size-14">
        <span className="size-2 rounded-full bg-slate-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative z-10 flex size-10 items-center justify-center rounded-full',
        'bg-slate-100 text-slate-300 sm:size-14',
      )}
    >
      <X className="size-6 stroke-3 sm:size-7" />
    </div>
  );
}
