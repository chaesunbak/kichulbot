import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function MissionSection() {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <CardTitle>미션</CardTitle>
        <CardAction>
          <Button asChild variant="link">
            <Link href="/missions" aria-label="미션 페이지로 이동">
              더보기
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div
          className="
            flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg
            bg-muted px-4 py-8 text-center
          "
        >
          <span className="text-sm font-medium text-muted-foreground">
            아직 미션이 없어요.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
