import Link from 'next/link';

import { RegisterOptions } from '@/features/auth/components/register-options';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { PageContainer } from '@/shared/components/page-container';

type RegisterPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);

  return (
    <PageContainer
      className="
        min-h-[calc(100svh-16rem)] items-center justify-center
      "
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
          </div>

          <RegisterOptions nextPath={nextPath} />
        </div>
      </div>
      <div className="text-center text-sm text-zinc-500">
        이미 계정이 있으신가요?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="text-blue-500 hover:underline"
        >
          로그인하기
        </Link>
      </div>
    </PageContainer>
  );
}
