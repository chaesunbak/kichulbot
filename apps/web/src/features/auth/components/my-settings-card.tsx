import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function MySettingsCard() {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-0">
        <CardTitle>설정</CardTitle>

        <CardAction>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="설정 페이지로 이동"
          >
            <Link href="/my/settings">
              <ChevronRight className="size-5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
