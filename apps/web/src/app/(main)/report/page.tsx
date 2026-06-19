import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import { getSolveSessionLogs } from '@/features/learning/api/server/queries';
import { RecapTrendSection } from '@/features/learning/components/recap-trend-section';
import {
  getRecapTrendPoints,
  getRecapWeaknessGroups,
  isCompletedSolveSessionLog,
} from '@/features/learning/lib/recap-stats';
import { getQuestionAttempts } from '@/features/question-attempts/api/server/queries';
import { getRecentStreakRange } from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function ReportPage() {
  const analysisRange = getRecentStreakRange(90);
  let logs: Awaited<ReturnType<typeof getSolveSessionLogs>>;
  let questionAttempts: Awaited<ReturnType<typeof getQuestionAttempts>>;
  try {
    [logs, questionAttempts] = await Promise.all([
      getSolveSessionLogs(),
      getQuestionAttempts(analysisRange.from, analysisRange.to, {
        includeTags: true,
      }),
    ]);
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/report');
    throw error;
  }
  const completedLogs = logs.filter(isCompletedSolveSessionLog);
  const trendPoints = getRecapTrendPoints(completedLogs);
  const weaknessGroups = getRecapWeaknessGroups(questionAttempts);

  return (
    <PageContainer>
      <PageTitle>학습 분석</PageTitle>
      <RecapTrendSection data={trendPoints} weaknessGroups={weaknessGroups} />
    </PageContainer>
  );
}
