import { toAttemptDate } from '@/features/question-attempts/lib/streak-date';
import type { QuestionAttempt } from '@/features/question-attempts/types';

type WeekDay = {
  label: string;
  date: string;
};

export function getSolvedDates(questionAttempts: QuestionAttempt[]) {
  return new Set(
    questionAttempts.map(({ gradedAt }) => toAttemptDate(gradedAt)),
  );
}

export function getCurrentStreakDays(today: string, solvedDates: Set<string>) {
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00.000Z`);

  while (solvedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function getWeeklyStreakItems(
  week: WeekDay[],
  today: string,
  solvedDates: Set<string>,
) {
  return week.map(({ label, date }) => {
    const isSolved = solvedDates.has(date);
    const isMissed = !isSolved && date < today;

    return {
      label,
      date,
      mark: isSolved ? 'O' : isMissed ? 'X' : '.',
      isSolved,
      isMissed,
    };
  });
}

export function countAttemptsByDate(questionAttempts: QuestionAttempt[]) {
  return questionAttempts.reduce<Record<string, number>>(
    (acc, { gradedAt }) => {
      const date = toAttemptDate(gradedAt);
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    },
    {},
  );
}
