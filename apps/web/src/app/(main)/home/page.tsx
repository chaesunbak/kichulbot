import { RecentPapersSection } from '@/features/home/components/recent-papers-section';
import { getSolveSessionLogs } from '@/features/learning/api/server';
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
  const [questionAttempts, solveSessionLogs] = await Promise.all([
    getQuestionAttempts(streakRange.from, currentWeek.to),
    getSolveSessionLogs(),
  ]);

  return (
    <PageContainer>
      <StreakSection questionAttempts={questionAttempts} />
      <RecentPapersSection logs={solveSessionLogs} />
    </PageContainer>
  );
}
