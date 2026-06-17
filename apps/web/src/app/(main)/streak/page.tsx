import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import { getQuestionAttempts } from '@/features/question-attempts/api/server/queries';
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
  const nextPath = params?.month ? `/streak?month=${month}` : '/streak';

  const range = getMonthRange(month);
  const currentWeek = getCurrentWeekRange();
  const streakRange = getRecentStreakRange();
  let data: Awaited<ReturnType<typeof loadStreakPageData>>;
  try {
    data = await loadStreakPageData({
      monthRange: range,
      streakFrom: streakRange.from,
      currentWeekTo: currentWeek.to,
    });
  } catch (error) {
    redirectToLoginIfUnauthorized(error, nextPath);
    throw error;
  }
  const { questionAttempts, weeklyQuestionAttempts } = data;
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

async function loadStreakPageData({
  monthRange,
  streakFrom,
  currentWeekTo,
}: {
  monthRange: { from: string; to: string };
  streakFrom: string;
  currentWeekTo: string;
}) {
  const [questionAttempts, weeklyQuestionAttempts] = await Promise.all([
    getQuestionAttempts(monthRange.from, monthRange.to),
    getQuestionAttempts(streakFrom, currentWeekTo),
  ]);
  return { questionAttempts, weeklyQuestionAttempts };
}
