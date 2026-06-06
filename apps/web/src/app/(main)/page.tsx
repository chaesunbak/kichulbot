import { FeatureSection } from '@/features/home/components/feature-section';
import { RecentLearningRecordsSection } from '@/features/home/components/recent-learning-records-section';
import { getSolveSessionLogs } from '@/features/learning/api/server';
import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import { StreakSection } from '@/features/question-attempts/components/streak-section';
import {
  getCurrentWeekRange,
  getRecentStreakRange,
} from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';

export default async function HomePage() {
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  const [questionAttempts, solveSessionLogs] = await Promise.all([
    getQuestionAttempts(streakRange.from, currentWeek.to),
    getSolveSessionLogs(),
  ]);

  return (
    <PageContainer>
      <StreakSection questionAttempts={questionAttempts} />
      <FeatureSection />
      <RecentLearningRecordsSection logs={solveSessionLogs} />
    </PageContainer>
  );
}
