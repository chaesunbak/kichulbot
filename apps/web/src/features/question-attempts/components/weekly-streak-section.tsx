import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  getSolvedDates,
  getWeeklyStreakItems,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';

interface WeeklyStreakSectionProps {
  questionAttempts: QuestionAttempt[];
}

export function WeeklyStreakSection({
  questionAttempts,
}: WeeklyStreakSectionProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = getSolvedDates(questionAttempts);
  const streakItems = getWeeklyStreakItems(
    currentWeek.week,
    currentWeek.today,
    solvedDates,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>이번 주 풀이 기록</CardTitle>
      </CardHeader>
      <CardContent
        className="
          grid grid-cols-7 gap-2 p-6
          sm:px-8
        "
      >
        {streakItems.map(({ label, date, mark, isSolved, isMissed }) => (
          <div key={date} className="text-center">
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div
              className={`
                mt-3 flex aspect-square items-center justify-center rounded-2xl
                text-lg font-black
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
        ))}
      </CardContent>
    </Card>
  );
}
