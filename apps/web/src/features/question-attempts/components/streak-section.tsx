import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight, Clock3, Flame, Users } from 'lucide-react';
import Link from 'next/link';

import { toHourMinuteDuration } from '@/shared/lib/duration';

interface StreakSectionProps {
  spentMilliseconds: number;
  currentStreakDays: number;
  activeUserCount: number;
}

export function StreakSection({
  spentMilliseconds,
  currentStreakDays,
  activeUserCount,
}: StreakSectionProps) {
  const { hours, minutes } = toHourMinuteDuration(spentMilliseconds);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground sm:divide-x sm:divide-border">
          <span className="inline-flex min-w-fit items-center gap-1 sm:gap-1.5 sm:pr-4">
            <Flame className="size-4 shrink-0 fill-orange-500 text-orange-500" />
            <span>
              연속 <span className="text-primary">{currentStreakDays}일</span>
            </span>
          </span>

          <span className="inline-flex min-w-fit items-center gap-1 sm:gap-1.5 sm:px-4">
            <Clock3 className="size-4 shrink-0 fill-muted text-muted-foreground" />
            <span className="text-primary">
              {hours}시간 {minutes}분
            </span>
            <span>학습 중</span>
          </span>

          <span className="inline-flex min-w-fit items-center gap-1 sm:gap-1.5 sm:pl-4">
            <Users className="size-4 shrink-0 fill-muted text-muted-foreground" />
            <span className="text-primary">{activeUserCount}명</span>
            <span>공부 중</span>
          </span>
        </CardTitle>

        <CardAction>
          <Button asChild variant="link" className="px-0">
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
