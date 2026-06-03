'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

import { ApiError, completeOAuthSessionApi } from '@/features/auth/api/client';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { useAuthStore } from '@/features/auth/store';

const OAUTH_NEXT_COOKIE_NAME = 'kichulbot_oauth_next';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const accessToken = searchParams.get('accessToken');
    const oauthStatus = searchParams.get('oauth');

    if (!accessToken && oauthStatus === 'connected') {
      router.replace('/my/settings?oauth=connected');
      return;
    }

    if (!accessToken) {
      router.replace('/login?oauth=failed');
      return;
    }

    completeOAuthSessionApi(accessToken)
      .then((data) => {
        setAuth(data.user);
        router.replace(takeOAuthNextPath());
      })
      .catch((error) => {
        const query =
          error instanceof ApiError
            ? `?message=${encodeURIComponent(error.message)}`
            : '';
        const nextPath = takeOAuthNextPath();
        const separator = query ? '&' : '?';
        router.replace(
          `/login${query}${separator}next=${encodeURIComponent(nextPath)}`,
        );
      });
  }, [router, searchParams, setAuth]);

  return (
    <p className="text-center text-sm text-zinc-500">잠시만 기다려주세요...</p>
  );
}

function takeOAuthNextPath() {
  const nextPath = normalizeNextPath(readCookie(OAUTH_NEXT_COOKIE_NAME), {
    decode: true,
  });
  document.cookie = `${OAUTH_NEXT_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;
  return nextPath;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  return (
    document.cookie
      .split('; ')
      .find((item) => item.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-zinc-500">
          잠시만 기다려주세요...
        </p>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
