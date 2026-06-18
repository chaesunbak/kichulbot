import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  countSolvedDatesInWeek,
  getCurrentStreakDays,
  getLongestStreakDays,
  getSolvedDates,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { cn } from '@/shared/lib/utils';

interface StreakSummaryCardProps {
  countsByDate: Record<string, number>;
  questionAttempts: QuestionAttempt[];
  targetDays: number;
  totalDaysInMonth: number;
}

export function StreakSummaryCard({
  countsByDate,
  questionAttempts,
  targetDays,
  totalDaysInMonth,
}: StreakSummaryCardProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = getSolvedDates(questionAttempts);
  const currentStreakDays = getCurrentStreakDays(
    currentWeek.today,
    solvedDates,
  );
  const longestStreakDays = getLongestStreakDays(solvedDates);
  const monthlySolvedDays = Object.values(countsByDate).filter(
    (count) => count > 0,
  ).length;
  const weeklySolvedDays = countSolvedDatesInWeek(
    currentWeek.week,
    solvedDates,
  );
  const weeklyRate = Math.round((weeklySolvedDays / targetDays) * 100);

  return (
    <Card className="rounded-3xl">
      <CardContent
        className="
          grid grid-cols-3 gap-0
          px-2 sm:px-6
        "
      >
        <SummaryItem
          icon={
            <Flame className="size-4 shrink-0 fill-orange-500 text-orange-500 sm:size-5" />
          }
          label="현재 연속 학습"
          value={`${currentStreakDays}일`}
          description={`최고 기록 ${longestStreakDays}일`}
        />
        <SummaryItem
          className="border-l"
          label="이번 달 연속 학습일"
          value={`${monthlySolvedDays}일`}
          description={`총 ${totalDaysInMonth}일 중`}
        />
        <SummaryItem
          className="border-l"
          label="주간 달성률"
          value={`${weeklyRate}%`}
          description={`${weeklySolvedDays} / ${targetDays}일 달성`}
        />
      </CardContent>
    </Card>
  );
}

interface SummaryItemProps {
  className?: string;
  description: string;
  icon?: ReactNode;
  label: string;
  value: string;
}

function SummaryItem({
  className,
  description,
  icon,
  label,
  value,
}: SummaryItemProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-1 text-center sm:gap-2',
        className,
      )}
    >
      <div className="flex min-h-8 items-center justify-center gap-0.5 text-[11px] leading-tight font-semibold text-muted-foreground sm:gap-1 sm:text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl leading-none font-bold text-foreground sm:text-2xl">
        {value}
      </div>
      <div className="text-[11px] whitespace-nowrap text-muted-foreground sm:text-xs">
        {description}
      </div>
    </div>
  );
}
