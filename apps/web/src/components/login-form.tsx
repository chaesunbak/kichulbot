'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kichulbot/ui/components/button';
import { Input } from '@kichulbot/ui/components/input';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/field';
import { useAuthStore } from '@/stores/auth-store';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth';
import { loginApi, ApiError } from '@/lib/api/auth';

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const data = await loginApi(values.email, values.password);
      setAuth(data.accessToken, data.user);
      router.push('/home');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setServerError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('로그인 중 오류가 발생했습니다');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호 입력"
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </FieldGroup>
    </form>
  );
}
