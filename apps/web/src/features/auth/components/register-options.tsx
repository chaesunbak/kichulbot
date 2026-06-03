import { Button } from '@kichulbot/ui/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import { GuestButton } from '@/features/auth/components/guest-button';
import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';

interface RegisterOptionsProps {
  isGuestConvert: boolean;
  nextPath?: string;
}

export function RegisterOptions({
  isGuestConvert,
  nextPath,
}: RegisterOptionsProps) {
  return (
    <div className="flex flex-col gap-3">
      {isGuestConvert ? (
        <Button asChild size="lg" variant="outline">
          <Link href="/">게스트 계정으로 시작하기</Link>
        </Button>
      ) : (
        <GuestButton />
      )}

      <Button asChild size="lg" variant="outline">
        <Link
          href={`/register/email?next=${encodeURIComponent(nextPath ?? '/')}`}
        >
          <Mail className="size-4" />
          이메일로 시작하기
        </Link>
      </Button>

      <KakaoAuthButton
        href={getKakaoAuthStartPath(
          isGuestConvert ? 'convert' : 'login',
          nextPath,
        )}
      >
        카카오 계정으로 시작하기
      </KakaoAuthButton>
    </div>
  );
}
