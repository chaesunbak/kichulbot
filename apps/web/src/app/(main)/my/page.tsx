import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';

import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function MyPage() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <PageContainer>
      <PageTitle>마이 페이지</PageTitle>
      <section
        className="
          mt-6 grid gap-4
          lg:grid-cols-[minmax(0,1fr)_20rem]
        "
      >
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
            <p className="mt-4 text-lg font-semibold text-zinc-900">
              {user.nickname ?? '게스트'}
            </p>
            <p
              className="
                mt-1 flex min-w-0 items-center gap-1.5 text-sm text-zinc-500
              "
            >
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{user.email ?? '게스트 계정'}</span>
            </p>
          </CardContent>
        </Card>

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
      </section>
    </PageContainer>
  );
}
