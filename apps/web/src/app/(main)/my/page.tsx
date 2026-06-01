import Link from 'next/link';
import { Mail, UserRound } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import { Card, CardContent } from '@kichulbot/ui/components/card';
import { LogoutButton } from '@/components/logout-button';
import { getUser } from '@/lib/auth';

export default async function MyPage() {
  const user = await getUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">마이페이지</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">내 정보</h1>

      <Card className="mt-6 max-w-xl">
        <CardContent>
          <p className="mt-4 text-lg font-semibold text-zinc-900">
            {user.nickname ?? '게스트'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <Mail className="size-4" />
            {user.email ?? '게스트 계정'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {user.authType === 'ANONYMOUS' && (
              <Button asChild>
                <Link href="/register">계정 만들기</Link>
              </Button>
            )}
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
