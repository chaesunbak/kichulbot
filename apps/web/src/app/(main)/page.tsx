import { isUnauthorizedError } from '@/features/auth/api/server/redirect';
import { FeatureSection } from '@/features/home/components/feature-section';
import { MissionSection } from '@/features/home/components/mission-section';
import { RecentLearningRecordsSection } from '@/features/home/components/recent-learning-records-section';
import { getSolveSessionLogPage } from '@/features/learning/api/server/queries';
import { getQuestionAttempts } from '@/features/question-attempts/api/server/queries';
import { StreakSection } from '@/features/question-attempts/components/streak-section';
import {
  getCurrentWeekRange,
  getRecentStreakRange,
} from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';

export default async function HomePage() {
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  const [questionAttempts, solveSessionLogPage] = await Promise.all([
    getQuestionAttempts(streakRange.from, currentWeek.to).catch((error) => {
      if (isUnauthorizedError(error)) return [];
      throw error;
    }),
    getSolveSessionLogPage({ limit: 4 }).catch((error) => {
      if (isUnauthorizedError(error)) {
        return { logs: [], total: 0, page: 1, limit: 4, totalPages: 0 };
      }
      throw error;
    }),
  ]);

  return (
    <PageContainer>
      <StreakSection questionAttempts={questionAttempts} />
      <FeatureSection />
      <div
        className="
          grid gap-6
          lg:grid-cols-[minmax(0,1fr)_22rem]
        "
      >
        <RecentLearningRecordsSection logs={solveSessionLogPage.logs} />
        <MissionSection />
      </div>
    </PageContainer>
  );
}
