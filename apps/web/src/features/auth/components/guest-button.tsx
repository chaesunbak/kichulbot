'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kichulbot/ui/components/button';
import { useAuthStore } from '@/features/auth/store';
import { anonymousLoginApi } from '@/features/auth/api';

export function GuestButton() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await anonymousLoginApi();
      setAuth(data.user);
      router.push('/home');
    } catch {
      setError('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={handleClick}
      >
        {loading ? '시작 중...' : '시작하기'}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
