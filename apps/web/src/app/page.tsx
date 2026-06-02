import { Button } from '@kichulbot/ui/components/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { GuestButton } from '@/features/auth/components/guest-button';
import { getUser } from '@/features/auth/server';

export default async function Home() {
  const user = await getUser();
  if (user) redirect('/home');

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-10 px-4"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          기출봇
        </h1>
        <p className="mt-4 max-w-sm text-base/relaxed text-zinc-500">
          기출문제 풀이 기록을 저장하고,
          <br />
          반복해서 틀리는 유형을 분석해드립니다.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <GuestButton />
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">로그인</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link href="/register">회원가입</Link>
        </Button>
      </div>
    </div>
  );
}
