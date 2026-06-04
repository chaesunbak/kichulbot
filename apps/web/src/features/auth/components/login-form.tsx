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
import { PasswordInput } from '@kichulbot/ui/components/ui/password-input';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApiError, loginWithEmailApi } from '@/features/auth/api/client';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { loginSchema } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store';
import type { LoginFormValues } from '@/features/auth/types';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const data = await loginWithEmailApi({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      setAuth(data.user);
      router.push(normalizeNextPath(searchParams.get('next')));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '로그인 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="login-email">이메일</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="student@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel htmlFor="login-password">비밀번호</FieldLabel>
            <Link
              href="/password-reset"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          이메일로 로그인
        </Button>
      </FieldGroup>
    </form>
  );
}
