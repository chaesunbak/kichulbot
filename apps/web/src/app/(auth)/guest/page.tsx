'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function GuestPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    fetch('/api/auth/anonymous', { method: 'POST' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user);
          router.replace('/home');
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router, setAuth]);

  return (
    <p className="text-center text-sm text-zinc-500">잠시만 기다려주세요...</p>
  );
}
