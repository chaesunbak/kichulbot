import { PasswordResetForm } from '@/features/auth/components/password-reset-form';

interface PasswordResetPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function PasswordResetPage({
  searchParams,
}: PasswordResetPageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          비밀번호 재설정
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {token
            ? '새 비밀번호를 입력해주세요'
            : '가입한 이메일로 재설정 링크를 보내드립니다'}
        </p>
      </div>

      <PasswordResetForm token={token} />
    </div>
  );
}
