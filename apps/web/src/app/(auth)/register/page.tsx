import Link from 'next/link';

import RegisterForm from '@/features/auth/components/register-form';
import { getCachedUser } from '@/features/auth/server';

export default async function RegisterPage() {
  const user = await getCachedUser();
  const isGuestConvert = user?.authType === 'ANONYMOUS';

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isGuestConvert ? '계정 만들기' : '회원가입'}
        </h1>
        {isGuestConvert && (
          <p className="mt-2 text-sm text-zinc-500">
            게스트 기록이 계정으로 이어집니다
          </p>
        )}
      </div>

      <RegisterForm isGuestConvert={isGuestConvert} />

      <p className="text-center text-sm text-zinc-500">
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          className="
            font-medium text-zinc-900
            hover:underline
          "
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
