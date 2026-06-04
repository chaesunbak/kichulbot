import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/features/auth/components/login-form';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';

type EmailLoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function EmailLoginPage({
  searchParams,
}: EmailLoginPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);
  const user = await getCachedUser();
  if (user) redirect(nextPath);

  return (
    <PageContainer
      className="min-h-[calc(100svh-16rem)] items-center justify-center"
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              이메일 로그인
            </h1>
          </div>

          <LoginForm />

          <div className="flex flex-col gap-2">
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

            <p className="text-center text-sm text-zinc-500">
              비밀번호를 잊으셨나요?{' '}
              <Link
                href="/password-reset"
                className="
                  text-blue-500
                  hover:underline
                "
              >
                비밀번호 재설정
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
