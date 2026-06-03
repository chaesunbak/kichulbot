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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  ApiError,
  confirmPasswordResetApi,
  requestPasswordResetApi,
} from '@/features/auth/api/client';
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@/features/auth/schemas';
import type {
  PasswordResetConfirmFormValues,
  PasswordResetRequestFormValues,
} from '@/features/auth/types';

interface PasswordResetFormProps {
  token?: string;
}

export function PasswordResetForm({ token }: PasswordResetFormProps) {
  if (token) {
    return <PasswordResetConfirmForm token={token} />;
  }

  return <PasswordResetRequestForm />;
}

function PasswordResetRequestForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: PasswordResetRequestFormValues) => {
    setServerError(null);

    try {
      await requestPasswordResetApi(values.email.trim().toLowerCase());
      setSent(true);
      toast.success('비밀번호 재설정 링크를 보냈습니다.');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '재설정 링크 발송 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-600">
          이메일 계정이 있다면 비밀번호 재설정 링크가 발송됩니다.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">로그인으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="reset-email">이메일</FieldLabel>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="student@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          재설정 링크 받기
        </Button>
      </FieldGroup>
    </form>
  );
}

function PasswordResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormValues>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      token,
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (values: PasswordResetConfirmFormValues) => {
    setServerError(null);

    try {
      await confirmPasswordResetApi({
        token: values.token,
        password: values.password,
      });
      toast.success('비밀번호를 재설정했습니다.');
      router.push('/login');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '비밀번호 재설정 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register('token')} />
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="reset-password">새 비밀번호</FieldLabel>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="reset-password-confirm">
            새 비밀번호 확인
          </FieldLabel>
          <PasswordInput
            id="reset-password-confirm"
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

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          비밀번호 재설정
        </Button>
      </FieldGroup>
    </form>
  );
}
