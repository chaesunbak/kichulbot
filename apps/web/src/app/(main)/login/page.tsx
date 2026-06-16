import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUserOrNull } from '@/features/auth/api/server/queries';
import { LoginMethodActions } from '@/features/auth/components/login-method-actions';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { PageContainer } from '@/shared/components/page-container';

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);
  const user = await getCurrentUserOrNull();
  if (user) redirect(nextPath);

  return (
    <PageContainer className="min-h-[calc(100svh-16rem)] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
            <span className="mt-2 text-sm text-muted-foreground">
              기출봇에 오신 것을 환영합니다
            </span>
          </div>

          <LoginMethodActions
            emailHref={`/login/email?next=${encodeURIComponent(nextPath)}`}
            kakaoHref={getKakaoAuthStartPath('login', nextPath)}
          />
          <span className="text-center text-sm text-muted-foreground">
            아직 계정이 없으신가요?{' '}
            <Link
              href={`/register?next=${encodeURIComponent(nextPath)}`}
              className="
                text-primary
                hover:underline
              "
            >
              회원가입하기
            </Link>
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
