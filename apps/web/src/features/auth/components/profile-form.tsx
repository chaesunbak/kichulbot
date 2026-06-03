'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApiError, updateProfileApi } from '@/features/auth/api/client';
import { updateProfileSchema } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store';
import type { UpdateProfileFormValues } from '@/features/auth/types';

interface ProfileFormProps {
  email: string | null;
  nickname: string;
}

export function ProfileForm({ email, nickname }: ProfileFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname,
    },
  });

  const onSubmit = async (values: UpdateProfileFormValues) => {
    setServerError(null);

    try {
      const data = await updateProfileApi(values.nickname.trim());
      setAuth(data.user);
      toast.success('닉네임을 변경했습니다.');
      router.push('/my');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '닉네임 변경 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input
            id="email"
            type="text"
            defaultValue={email ?? '게스트 계정'}
            disabled
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
          <Input
            id="nickname"
            type="text"
            placeholder="사용할 닉네임"
            autoComplete="nickname"
            aria-invalid={!!errors.nickname}
            {...register('nickname')}
          />
          <FieldError errors={[errors.nickname]} />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="
            w-full
            sm:w-auto
          "
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </FieldGroup>
    </form>
  );
}
