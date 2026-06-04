import { Button } from '@kichulbot/ui/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);
  const user = await getCachedUser();
  if (user) redirect(nextPath);

  return (
    <PageContainer
      className="min-h-[calc(100svh-16rem)] items-center justify-center"
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
            <p className="mt-2 text-sm text-zinc-500">
              기출봇에 오신 것을 환영합니다
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button asChild size="lg" variant="outline">
              <Link href={`/login/email?next=${encodeURIComponent(nextPath)}`}>
                <Mail className="size-4" />
                이메일로 로그인하기
              </Link>
            </Button>
            <KakaoAuthButton href={getKakaoAuthStartPath('login', nextPath)}>
              카카오 계정으로 시작하기
            </KakaoAuthButton>
          </div>
          <p className="text-center text-sm text-zinc-500">
            아직 계정이 없으신가요?{' '}
            <Link
              href={`/register?next=${encodeURIComponent(nextPath)}`}
              className="
                text-blue-500
                hover:underline
              "
            >
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
