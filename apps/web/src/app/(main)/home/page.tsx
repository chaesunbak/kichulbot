import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import {
  getCurrentWeekRange,
  getRecentStreakRange,
  StreakSection,
} from '@/features/question-attempts/components/streak-section';
import { PageContainer } from '@/shared/components/page-container';

export default async function HomePage() {
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  const questionAttempts = await getQuestionAttempts(
    streakRange.from,
    currentWeek.to,
  );

  return (
    <PageContainer className="max-w-5xl">
      <StreakSection questionAttempts={questionAttempts} />
    </PageContainer>
  );
}
