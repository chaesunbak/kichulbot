import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import { Flame } from 'lucide-react';
import type { ReactNode } from 'react';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  getCurrentStreakDays,
  getLongestStreakDays,
  getSolvedDates,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { cn } from '@/shared/lib/utils';

interface StreakSummaryCardProps {
  countsByDate: Record<string, number>;
  questionAttempts: QuestionAttempt[];
  totalDaysInMonth: number;
}

export function StreakSummaryCard({
  countsByDate,
  questionAttempts,
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
  const weekdaySolvedDays = currentWeek.week
    .slice(0, 5)
    .filter(({ date }) => solvedDates.has(date)).length;
  const weeklyGoalDays = 5;
  const weeklyRate = Math.round((weekdaySolvedDays / weeklyGoalDays) * 100);

  return (
    <Card className="rounded-3xl">
      <CardContent
        className="
          grid gap-4
          sm:grid-cols-3 sm:gap-0
        "
      >
        <SummaryItem
          icon={<Flame className="size-5 fill-orange-500 text-orange-500" />}
          label="현재 연속 학습"
          value={`연속 ${currentStreakDays}일`}
          description={`최고 기록 ${longestStreakDays}일`}
        />
        <SummaryItem
          className="border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0"
          label="이번 달 출석일"
          value={`${monthlySolvedDays}일`}
          description={`총 ${totalDaysInMonth}일 중`}
        />
        <SummaryItem
          className="border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0"
          label="주간 달성률"
          value={`${weeklyRate}%`}
          description={`${weekdaySolvedDays} / ${weeklyGoalDays}일 달성`}
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
      className={cn('flex flex-col items-center gap-2 text-center', className)}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-zinc-800">{value}</div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
  );
}
