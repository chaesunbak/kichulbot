import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import { StreakSummaryCard } from '@/features/question-attempts/components/streak-summary-card';
import {
  getCurrentWeekRange,
  getMonthRange,
  getRecentStreakRange,
  normalizeMonth,
} from '@/features/question-attempts/lib/streak-date';
import { countAttemptsByDate } from '@/features/question-attempts/lib/streak-summary';
import { ConstructionSection } from '@/shared/components/construction-section';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

interface StreakPageProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function StreakPage({ searchParams }: StreakPageProps) {
  const params = await searchParams;
  const month = normalizeMonth(params?.month);
  const user = await getCachedUser();
  const nextPath = params?.month ? `/streak?month=${month}` : '/streak';
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const range = getMonthRange(month);
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  const [questionAttempts, weeklyQuestionAttempts] = await Promise.all([
    getQuestionAttempts(range.from, range.to),
    getQuestionAttempts(streakRange.from, currentWeek.to),
  ]);
  const countsByDate = countAttemptsByDate(questionAttempts);
  const totalDaysInMonth = Number(range.to.slice(-2));

  return (
    <PageContainer>
      <PageTitle>연속 학습</PageTitle>
      <StreakSummaryCard
        countsByDate={countsByDate}
        questionAttempts={weeklyQuestionAttempts}
        totalDaysInMonth={totalDaysInMonth}
      />
      <ConstructionSection />
    </PageContainer>
  );
}
