'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kichulbot/ui/components/ui/alert-dialog';
import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { ApiError, deleteAccountApi } from '@/features/auth/api/client';
import { useAuthStore } from '@/features/auth/store';

export function DeleteAccountButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      await deleteAccountApi();
      clearAuth();
      router.push('/');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '계정 삭제 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2 />
          계정 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>계정을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            계정을 삭제하면 학습 기록, 북마크, 보관함 데이터가 함께 삭제되며
            되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending && <Loader2 className="animate-spin" />}
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
