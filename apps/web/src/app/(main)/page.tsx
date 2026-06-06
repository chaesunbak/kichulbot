import {
  FeatureSection,
  type FeatureSectionItem,
} from '@/features/home/components/feature-section';
import { RecentPapersSection } from '@/features/home/components/recent-papers-section';
import { getSolveSessionLogs } from '@/features/learning/api/server';
import { getQuestionAttempts } from '@/features/question-attempts/api/server';
import { StreakSection } from '@/features/question-attempts/components/streak-section';
import {
  getCurrentWeekRange,
  getRecentStreakRange,
} from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';

const featureItems = [
  {
    href: '/library',
    label: '내서재',
    iconSrc: '/icons/home/library.png?v=20260606',
  },
  {
    href: '/resources',
    label: '시험지 풀이',
    iconSrc: '/icons/home/paper.png?v=20260606',
  },
  {
    href: '/resources/search',
    label: '문제 검색',
    iconSrc: '/icons/home/search.png?v=20260606',
  },
  {
    href: '/recap',
    label: '오답 복습',
    iconSrc: '/icons/home/recap.png?v=20260606',
  },
  {
    href: '/library',
    label: '북마크',
    iconSrc: '/icons/home/bookmark.png?v=20260606',
  },
  {
    href: '/report',
    label: '학습 분석',
    iconSrc: '/icons/home/report.png?v=20260606',
  },
] satisfies FeatureSectionItem[];

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
      <FeatureSection items={featureItems} />
      <RecentPapersSection logs={solveSessionLogs} />
    </PageContainer>
  );
}
