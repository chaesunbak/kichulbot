'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';

import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { RecentLoginBubble } from '@/features/auth/components/recent-login-bubble';
import {
  parseRecentLoginRecord,
  RECENT_LOGIN_STORAGE_KEY,
} from '@/features/auth/lib/recent-login';

interface LoginMethodActionsProps {
  emailHref: string;
  kakaoHref: string;
}

export function LoginMethodActions({
  emailHref,
  kakaoHref,
}: LoginMethodActionsProps) {
  const recentLoginSnapshot = useSyncExternalStore(
    subscribeRecentLoginStorage,
    getRecentLoginSnapshot,
    () => null,
  );
  const recentLogin = useMemo(
    () =>
      recentLoginSnapshot ? parseRecentLoginRecord(recentLoginSnapshot) : null,
    [recentLoginSnapshot],
  );

  const emailIsRecent = recentLogin?.method === 'email';
  const kakaoIsRecent = recentLogin?.method === 'kakao';

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {emailIsRecent && <RecentLoginBubble />}
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 w-full rounded-full px-5 text-base"
        >
          <Link href={emailHref}>
            <Mail className="size-5" />
            이메일로 로그인하기
          </Link>
        </Button>
      </div>

      <div className="relative">
        {kakaoIsRecent && <RecentLoginBubble />}
        <KakaoAuthButton href={kakaoHref}>
          카카오 계정으로 시작하기
        </KakaoAuthButton>
      </div>
    </div>
  );
}

function subscribeRecentLoginStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getRecentLoginSnapshot() {
  try {
    return window.localStorage.getItem(RECENT_LOGIN_STORAGE_KEY);
  } catch {
    return null;
  }
}
