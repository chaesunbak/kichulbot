import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUserOrNull } from '@/features/auth/api/server/queries';
import { EmailRegisterForm } from '@/features/auth/components/email-register-form';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { PageContainer } from '@/shared/components/page-container';

type EmailRegisterPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function EmailRegisterPage({
  searchParams,
}: EmailRegisterPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);
  const user = await getCurrentUserOrNull();
  if (user) redirect(nextPath);

  return (
    <PageContainer
      className="
      min-h-[calc(100svh-16rem)] items-center justify-center
    "
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              이메일 회원가입
            </h1>
          </div>

          <EmailRegisterForm />
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="
                text-primary
                hover:underline
              "
              >
                로그인하기
              </Link>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>
                다른 가입 방식으로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
