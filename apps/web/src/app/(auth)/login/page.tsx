import Link from 'next/link';

import LoginForm from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-2 text-sm text-zinc-500">
          기출봇에 오신 것을 환영합니다
        </p>
      </div>
      <LoginForm />
      <div className="flex flex-col gap-3 text-center text-sm text-zinc-500">
        <p>
          계정이 없으신가요?{' '}
          <Link
            href="/register"
            className="
              font-medium text-zinc-900
              hover:underline
            "
          >
            회원가입
          </Link>
        </p>
        <p>
          <Link
            href="/"
            className="
              font-medium text-zinc-900
              hover:underline
            "
          >
            게스트로 시작하기
          </Link>
        </p>
      </div>
    </div>
  );
}
