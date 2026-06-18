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
import { getCurrentStudyWeeklyGoal } from '@/features/study-weekly-goals/api/server/queries';
import { WeeklyStudyGoalCard } from '@/features/study-weekly-goals/components/weekly-study-goal-card';
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
  let data: {
    goal: Awaited<ReturnType<typeof getCurrentStudyWeeklyGoal>>;
    questionAttempts: Awaited<ReturnType<typeof getQuestionAttempts>>;
    weeklyQuestionAttempts: Awaited<ReturnType<typeof getQuestionAttempts>>;
  };
  try {
    const [questionAttempts, weeklyQuestionAttempts, goal] = await Promise.all([
      getQuestionAttempts(range.from, range.to),
      getQuestionAttempts(streakRange.from, currentWeek.to),
      getCurrentStudyWeeklyGoal(),
    ]);
    data = { goal, questionAttempts, weeklyQuestionAttempts };
  } catch (error) {
    redirectToLoginIfUnauthorized(error, nextPath);
    throw error;
  }
  const { goal, questionAttempts, weeklyQuestionAttempts } = data;
  const countsByDate = countAttemptsByDate(questionAttempts);
  const totalDaysInMonth = Number(range.to.slice(-2));

  return (
    <PageContainer>
      <PageTitle>연속 학습</PageTitle>
      <StreakSummaryCard
        countsByDate={countsByDate}
        questionAttempts={weeklyQuestionAttempts}
        targetDays={goal.targetDays}
        totalDaysInMonth={totalDaysInMonth}
      />
      <WeeklyStudyGoalCard
        goal={goal}
        questionAttempts={weeklyQuestionAttempts}
      />
    </PageContainer>
  );
}
