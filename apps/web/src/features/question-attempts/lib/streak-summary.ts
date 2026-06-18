import { toAttemptDate } from '@/features/question-attempts/lib/streak-date';
import type { QuestionAttempt } from '@/features/question-attempts/types';

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

export function getLongestStreakDays(solvedDates: Set<string>) {
  const sortedDates = [...solvedDates].sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDate: Date | null = null;

  sortedDates.forEach((date) => {
    const currentDate = new Date(`${date}T00:00:00.000Z`);
    const diffDays = previousDate
      ? (currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000)
      : null;

    currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    previousDate = currentDate;
  });

  return longestStreak;
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

export function countSolvedDatesInWeek(
  week: Array<{ date: string }>,
  solvedDates: Set<string>,
) {
  return week.filter(({ date }) => solvedDates.has(date)).length;
}
