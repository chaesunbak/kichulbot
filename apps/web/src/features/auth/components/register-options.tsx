import { Button } from '@kichulbot/ui/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';

interface RegisterOptionsProps {
  nextPath?: string;
}

export function RegisterOptions({ nextPath }: RegisterOptionsProps) {
  return (
    <div className="flex flex-col gap-3">
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
  );
}
