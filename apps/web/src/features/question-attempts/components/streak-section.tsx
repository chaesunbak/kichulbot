import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';

import { getCurrentWeek } from '@/features/question-attempts/lib/streak-date';
import {
  getCurrentStreakDays,
  getSolvedDates,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';

interface StreakSectionProps {
  questionAttempts: QuestionAttempt[];
}

export function StreakSection({ questionAttempts }: StreakSectionProps) {
  const currentWeek = getCurrentWeek();
  const solvedDates = getSolvedDates(questionAttempts);
  const currentStreakDays = getCurrentStreakDays(
    currentWeek.today,
    solvedDates,
  );

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle className="flex items-center gap-1">
            <Flame className="inline-block size-4 text-orange-500 fill-orange-500" />{' '}
            연속 {currentStreakDays}일째 공부 중
          </CardTitle>
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
