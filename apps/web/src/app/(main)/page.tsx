import { isUnauthorizedError } from '@/features/auth/lib/auth-redirect';
import { FeatureSection } from '@/features/home/components/feature-section';
import { MissionSection } from '@/features/home/components/mission-section';
import { RecentLearningRecordsSection } from '@/features/home/components/recent-learning-records-section';
import { getSolveSessionLogPage } from '@/features/learning/api/server/queries';
import { StreakSection } from '@/features/question-attempts/components/streak-section';
import {
  getActiveUsers,
  getStudyStreak,
  getStudyTime,
} from '@/features/study-activity/api/server/queries';
import { PageContainer } from '@/shared/components/page-container';

export default async function HomePage() {
  const [studyTime, studyStreak, activeUsers, solveSessionLogPage] =
    await Promise.all([
      getStudyTime().catch((error) => {
        if (isUnauthorizedError(error)) {
          return { date: '', spentMilliseconds: 0 };
        }
        throw error;
      }),
      getStudyStreak().catch((error) => {
        if (isUnauthorizedError(error)) {
          return { currentStreakDays: 0 };
        }
        throw error;
      }),
      getActiveUsers(),
      getSolveSessionLogPage({ limit: 4 }).catch((error) => {
        if (isUnauthorizedError(error)) {
          return { logs: [], total: 0, page: 1, limit: 4, totalPages: 0 };
        }
        throw error;
      }),
    ]);

  return (
    <PageContainer>
      <StreakSection
        spentMilliseconds={studyTime.spentMilliseconds}
        currentStreakDays={studyStreak.currentStreakDays}
        activeUserCount={activeUsers.activeUserCount}
      />
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
