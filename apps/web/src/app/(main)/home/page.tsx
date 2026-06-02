import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import {
  getCurrentWeekRange,
  getRecentStreakRange,
  StreakSection,
} from '@/features/question-attempts/components/streak-section';

export default async function HomePage() {
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  const questionAttempts = await getQuestionAttempts(
    streakRange.from,
    currentWeek.to,
  );

  return (
    <div
      className="
        mx-auto max-w-5xl px-4 py-8
        sm:py-10
      "
    >
      <StreakSection questionAttempts={questionAttempts} />
    </div>
  );
}
