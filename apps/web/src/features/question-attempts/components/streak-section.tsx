import { Badge } from '@kichulbot/ui/components/badge';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  getCurrentStreakDays,
  getSolvedDates,
  getWeeklySolvedDayCount,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';

interface StreakSectionProps {
  questionAttempts: QuestionAttempt[];
}

export function StreakSection({ questionAttempts }: StreakSectionProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = getSolvedDates(questionAttempts);
  const solvedDayCount = getWeeklySolvedDayCount(currentWeek.week, solvedDates);
  const currentStreakDays = getCurrentStreakDays(
    currentWeek.today,
    solvedDates,
  );

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle>이번 주 {solvedDayCount}일 풀이했어요</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-2">
            🔥{currentStreakDays}
          </Badge>
        </div>
        <CardAction>
          <Button asChild variant="link">
            <Link href="/streak" aria-label="월별 풀이 기록으로 이동">
              더보기
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
