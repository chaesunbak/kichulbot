'use client';

import { ApiError } from '@kichulbot/api-contract';
import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { unlinkKakaoApi } from '@/features/auth/api/client/mutations';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
import type { AuthUser } from '@/features/auth/types';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';

interface KakaoConnectionActionProps {
  user: AuthUser;
}

export function KakaoConnectionAction({ user }: KakaoConnectionActionProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isLinked = user.linkedProviders.includes('KAKAO');
  const isOnlyAuthMethod =
    user.authMethods.length === 1 && user.authMethods.includes('KAKAO');

  const unlink = async () => {
    const shouldUnlink = await overlay.openAsync<boolean>(
      ({ isOpen, close, unmount }) => (
        <ConfirmDialog
          isOpen={isOpen}
          title="카카오 연결을 해제할까요?"
          description="해제 후에는 남은 로그인 수단으로만 로그인할 수 있습니다."
          destructive
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          onExit={unmount}
        />
      ),
    );
    if (!shouldUnlink) return;

    setIsPending(true);
    try {
      await unlinkKakaoApi();
      toast.success('카카오 연결을 해제했습니다.');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : '카카오 연결을 해제하지 못했습니다.',
      );
    } finally {
      setIsPending(false);
    }
  };

  if (!isLinked) {
    return (
      <Button asChild variant="link" className="h-auto justify-start p-0">
        <Link href={getKakaoAuthStartPath('link')}>연결하기</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      className="h-auto justify-start p-0 text-destructive"
      disabled={isPending || isOnlyAuthMethod}
      onClick={unlink}
    >
      {isPending && <Loader2 className="animate-spin" />}
      해제하기
    </Button>
  );
}
