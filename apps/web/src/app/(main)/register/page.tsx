import { Button } from '@kichulbot/ui/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
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
          <div className="flex flex-col gap-4">
            <Button asChild size="lg" variant="outline">
              <Link
                href={`/register/email?next=${encodeURIComponent(nextPath ?? '/')}`}
              >
                <Mail className="size-4" />
                이메일로 시작하기
              </Link>
            </Button>

            <KakaoAuthButton href={getKakaoAuthStartPath('login', nextPath)}>
              카카오 계정으로 시작하기
            </KakaoAuthButton>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-zinc-500">
        이미 계정이 있으신가요?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="
            text-blue-500
            hover:underline
          "
        >
          로그인하기
        </Link>
      </div>
    </PageContainer>
  );
}
