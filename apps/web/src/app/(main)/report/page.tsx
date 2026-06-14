import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import { getSolveSessionLogs } from '@/features/learning/api/server/queries';
import { RecapTrendSection } from '@/features/learning/components/recap-trend-section';
import {
  getRecapTrendPoints,
  getRecapWeaknessGroups,
} from '@/features/learning/lib/recap-stats';
import type { SolveSessionLog } from '@/features/learning/types';
import { getQuestionAttempts } from '@/features/question-attempts/api/server/queries';
import { getRecentStreakRange } from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function ReportPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/report');

  const analysisRange = getRecentStreakRange(90);
  const [logs, questionAttempts] = await Promise.all([
    getSolveSessionLogs(),
    getQuestionAttempts(analysisRange.from, analysisRange.to, {
      includeTags: true,
    }),
  ]);
  const completedLogs = logs.filter(isCompletedLog);
  const trendPoints = getRecapTrendPoints(completedLogs);
  const weaknessGroups = getRecapWeaknessGroups(questionAttempts);

  return (
    <PageContainer>
      <PageTitle>학습 분석</PageTitle>
      <RecapTrendSection data={trendPoints} weaknessGroups={weaknessGroups} />
    </PageContainer>
  );
}

type CompletedSolveSessionLog = SolveSessionLog & {
  result: NonNullable<SolveSessionLog['result']>;
  submittedAt: string;
};

function isCompletedLog(log: SolveSessionLog): log is CompletedSolveSessionLog {
  return !!log.submittedAt && !!log.result;
}
