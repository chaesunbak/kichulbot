import { Button } from '@kichulbot/ui/components/button';
import Link from 'next/link';

import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import { MonthlyStreakCalendar } from '@/features/question-attempts/components/monthly-streak-calendar';
import {
  formatMonthTitle,
  getMonthRange,
  normalizeMonth,
  shiftMonth,
  toAttemptDate,
} from '@/features/question-attempts/lib/streak-date';

interface StreakPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

function countAttemptsByDate(gradedAts: string[]) {
  return gradedAts.reduce<Record<string, number>>((acc, gradedAt) => {
    const date = toAttemptDate(gradedAt);
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {});
}

export default async function StreakPage({ searchParams }: StreakPageProps) {
  const params = await searchParams;
  const month = normalizeMonth(params?.month);
  const range = getMonthRange(month);
  const questionAttempts = await getQuestionAttempts(range.from, range.to);
  const countsByDate = countAttemptsByDate(
    questionAttempts.map(({ gradedAt }) => gradedAt),
  );
  const previousMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);

  return (
    <main
      className="
        mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8
        sm:py-10
      "
    >
      <section className="
        flex flex-col gap-4
        sm:flex-row sm:items-end sm:justify-between
      ">
        <h2 className="text-2xl font-semibold text-zinc-900">
          {formatMonthTitle(month)}
        </h2>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/streak?month=${previousMonth}`}>이전 달</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/streak?month=${nextMonth}`}>다음 달</Link>
          </Button>
        </div>
      </section>

      <MonthlyStreakCalendar month={month} countsByDate={countsByDate} />
    </main>
  );
}
