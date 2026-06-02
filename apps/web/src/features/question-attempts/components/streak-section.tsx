import { Badge } from '@kichulbot/ui/components/badge';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  getCurrentWeek,
  getCurrentWeekRange,
  getRecentStreakRange,
  toAttemptDate,
} from '@/features/question-attempts/lib/streak-date';
import type { QuestionAttempt } from '@/features/question-attempts/types';

function getMark(date: string, today: string, solvedDates: Set<string>) {
  if (solvedDates.has(date)) return 'O';
  if (date < today) return 'X';
  return '.';
}

function getCurrentStreakDays(today: string, solvedDates: Set<string>) {
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00.000Z`);

  while (solvedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

interface StreakSectionProps {
  questionAttempts: QuestionAttempt[];
}

export { getCurrentWeekRange, getRecentStreakRange };

export function StreakSection({ questionAttempts }: StreakSectionProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = new Set(
    questionAttempts.map(({ gradedAt }) => toAttemptDate(gradedAt)),
  );
  const solvedDayCount = currentWeek.week.filter(({ date }) =>
    solvedDates.has(date),
  ).length;
  const currentStreakDays = getCurrentStreakDays(
    currentWeek.today,
    solvedDates,
  );

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle>이번 주 {solvedDayCount}일 풀이했어요</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-2">
            🔥{currentStreakDays}
          </Badge>
        </div>
        <CardAction>
          <Button asChild variant="outline">
            <Link href="/streak" aria-label="월별 풀이 기록으로 이동">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent
        className="
          mt-2 grid grid-cols-7 gap-2 px-6
          sm:px-8
        "
      >
        {currentWeek.week.map(({ label, date }) => {
          const mark = getMark(date, currentWeek.today, solvedDates);
          const isSolved = mark === 'O';
          const isMissed = mark === 'X';

          return (
            <div key={date} className="text-center">
              <div className="text-sm font-medium text-slate-500">{label}</div>
              <div
                className={`
                  mt-3 flex aspect-square items-center justify-center
                  rounded-2xl text-lg font-black
                  ${
                    isSolved
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                      : isMissed
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-slate-50 text-slate-300'
                  }
                `}
                aria-label={`${date} ${
                  isSolved ? '풀이함' : isMissed ? '풀이 안 함' : '예정'
                }`}
              >
                {mark}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
