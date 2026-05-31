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
import { registerSchema, type RegisterFormValues } from '@/lib/schemas/auth';
import { registerApi, ApiError } from '@/lib/api/auth';

interface Props {
  isGuestConvert: boolean;
}

export default function RegisterForm({ isGuestConvert }: Props) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const data = await registerApi(
        values.email,
        values.password,
        values.nickname,
      );
      setAuth(data.accessToken, data.user);
      router.push('/home');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError('이미 사용 중인 이메일입니다');
      } else if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('회원가입 중 오류가 발생했습니다');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-5">
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
            placeholder="8자 이상"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
          <Input
            id="passwordConfirm"
            type="password"
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            aria-invalid={!!errors.passwordConfirm}
            {...register('passwordConfirm')}
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? '처리 중...'
            : isGuestConvert
              ? '계정 만들기'
              : '회원가입'}
        </Button>
      </FieldGroup>
    </form>
  );
}
