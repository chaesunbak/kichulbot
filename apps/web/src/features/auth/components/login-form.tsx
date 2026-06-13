'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { ApiError } from '@kichulbot/api-contract';
import { PasswordInput } from '@kichulbot/ui/components/password-input';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginWithEmailApi } from '@/features/auth/api/client/mutations';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { rememberRecentLogin } from '@/features/auth/lib/recent-login';
import { loginSchema } from '@/features/auth/schemas';
import type { LoginFormValues } from '@/features/auth/types';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    const email = values.email.trim().toLowerCase();
    try {
      const { user } = await loginWithEmailApi({
        email,
        password: values.password,
      });
      posthog.identify(user.id, { email: user.email, nickname: user.nickname });
      posthog.capture('user_logged_in', { method: 'email' });
      rememberRecentLogin({ method: 'email', email: user.email ?? email });
      router.push(normalizeNextPath(searchParams.get('next')));
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        posthog.captureException(error);
      }
      const message =
        error instanceof ApiError
          ? error.message
          : '로그인 중 오류가 발생했습니다.';
      setServerError(message);
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
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">비밀번호</FieldLabel>
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
          로그인
        </Button>
      </FieldGroup>
    </form>
  );
}
