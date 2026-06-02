import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight, Mail, Settings } from 'lucide-react';
import Link from 'next/link';

import { getUser } from '@/features/auth/server';

export default async function MyPage() {
  const user = await getUser();
  if (!user) return null;

  return (
    <div
      className="
        mx-auto flex max-w-6xl flex-col px-4 py-8
        sm:px-6 sm:py-10
      "
    >
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">마이 페이지</h1>

      <Card className="mt-6 max-w-xl">
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
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <Mail className="size-4" />
            {user.email ?? '게스트 계정'}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4 max-w-xl">
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
    </div>
  );
}
