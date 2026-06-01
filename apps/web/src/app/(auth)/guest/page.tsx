'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { anonymousLoginApi } from '@/features/auth/api/client';
import { useAuthStore } from '@/features/auth/store';

export default function GuestPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    anonymousLoginApi()
      .then((data) => {
        setAuth(data.user);
        router.replace('/home');
      })
      .catch(() => router.replace('/login'));
  }, [router, setAuth]);

  return (
    <p className="text-center text-sm text-zinc-500">잠시만 기다려주세요...</p>
  );
}
