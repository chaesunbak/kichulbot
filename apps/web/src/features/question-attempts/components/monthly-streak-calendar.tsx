'use client';

import { Calendar } from '@kichulbot/ui/components/calendar';

import { cn } from '@/shared/lib/utils';

const KOREAN_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface MonthlyStreakCalendarProps {
  month: string;
  countsByDate: Record<string, number>;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthDate(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1);
}

export function MonthlyStreakCalendar({
  month,
  countsByDate,
}: MonthlyStreakCalendarProps) {
  return (
    <Calendar
      month={toMonthDate(month)}
      weekStartsOn={1}
      showOutsideDays={false}
      formatters={{
        formatCaption: (date) =>
          `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
        formatWeekdayName: (date) => KOREAN_WEEKDAY_LABELS[date.getDay()],
      }}
      className="
        w-full rounded-3xl border bg-card p-4 [--cell-size:--spacing(12)]
        sm:p-6 sm:[--cell-size:--spacing(14)]
      "
      classNames={{
        root: 'w-full',
        months: 'w-full',
        month: 'w-full',
        month_grid: 'w-full border-collapse',
        nav: 'hidden',
        day: 'group/day relative aspect-square h-full w-full rounded-2xl p-0 text-center select-none',
        today: 'rounded-2xl bg-amber-50 text-amber-700',
      }}
      components={{
        DayButton: ({ day, className, ...props }) => {
          const date = toLocalDateString(day.date);
          const count = countsByDate[date] ?? 0;
          const hasSolved = count > 0;

          return (
            <button
              {...props}
              className={cn(
                `
                  flex size-full min-h-12 flex-col items-center justify-center
                  rounded-2xl text-sm font-semibold transition-colors
                `,
                hasSolved
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                  : 'bg-slate-50 text-slate-400',
                className,
              )}
              type="button"
            >
              <span>{day.date.getDate()}</span>
              {hasSolved ? (
                <span className="mt-1 text-[11px] leading-none">🔥{count}</span>
              ) : null}
            </button>
          );
        },
      }}
    />
  );
}
