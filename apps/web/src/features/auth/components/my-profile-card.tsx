import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';

import type { AuthUser } from '@/features/auth/types';

interface MyProfileCardProps {
  user: AuthUser;
}

export function MyProfileCard({ user }: MyProfileCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-0">
        <CardTitle>프로필</CardTitle>
        <CardAction>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="프로필 페이지로 이동"
          >
            <Link href="/my/profile">
              <ChevronRight className="size-5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mt-4 text-lg font-semibold text-foreground">
          {user.nickname ?? user.email ?? '사용자'}
        </p>
        <p
          className="
            mt-1 flex min-w-0 items-center gap-1.5 text-sm
            text-muted-foreground
          "
        >
          <Mail className="size-4 shrink-0" />
          <span className="truncate">{user.email ?? '이메일 미제공'}</span>
        </p>
      </CardContent>
    </Card>
  );
}
