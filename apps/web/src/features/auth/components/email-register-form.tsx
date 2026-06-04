'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { PasswordInput } from '@kichulbot/ui/components/ui/password-input';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { generateRandomNickname } from '@kichulbot/utils';
import { Check, Dices, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  ApiError,
  confirmEmailVerificationApi,
  registerWithEmailApi,
  requestEmailVerificationApi,
} from '@/features/auth/api/client';
import { emailRegisterSchema } from '@/features/auth/schemas';
import { useAuthStore } from '@/features/auth/store';
import type { EmailRegisterFormValues } from '@/features/auth/types';

export function EmailRegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [initialNickname] = useState(() => generateRandomNickname());
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailRegisterFormValues>({
    resolver: zodResolver(emailRegisterSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      code: '',
      nickname: initialNickname,
      password: '',
      passwordConfirm: '',
    },
  });

  const currentEmail = useWatch({ control, name: 'email' })
    .trim()
    .toLowerCase();
  const isVerified = !!verificationToken && verifiedEmail === currentEmail;

  const handleSendCode = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    const email = getValues('email').trim().toLowerCase();

    setSending(true);
    setServerError(null);
    setVerifiedEmail(null);
    setVerificationToken(null);
    try {
      await requestEmailVerificationApi(email);
      toast.success('인증번호를 발송했습니다.');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '인증번호 발송 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleConfirmCode = async () => {
    const isCodeValid = await trigger(['email', 'code']);
    if (!isCodeValid) return;

    const email = getValues('email').trim().toLowerCase();
    const code = getValues('code').trim();

    setChecking(true);
    setServerError(null);
    try {
      const response = await confirmEmailVerificationApi({ email, code });
      if (!response.emailVerificationToken) {
        throw new Error('이메일 인증 응답이 올바르지 않습니다.');
      }
      setVerifiedEmail(email);
      setVerificationToken(response.emailVerificationToken);
      toast.success('이메일 인증이 완료되었습니다.');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '인증번호 확인 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  const handleGenerateNickname = () => {
    setValue('nickname', generateRandomNickname(), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: EmailRegisterFormValues) => {
    const email = values.email.trim().toLowerCase();
    if (!verificationToken || verifiedEmail !== email) {
      toast.error('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    setServerError(null);
    try {
      const data = await registerWithEmailApi({
        email,
        password: values.password,
        nickname: values.nickname?.trim() || undefined,
        emailVerificationToken: verificationToken,
      });
      setAuth(data.user);
      toast.success('이메일 회원가입이 완료되었습니다.');
      router.push('/');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '회원가입 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={sending}
              onClick={handleSendCode}
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              인증번호 발송
            </Button>
          </div>
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="code">인증번호</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              aria-invalid={!!errors.code}
              {...register('code')}
            />
            <Button
              type="button"
              variant={isVerified ? 'default' : 'outline'}
              className="shrink-0"
              disabled={checking || isVerified}
              onClick={handleConfirmCode}
            >
              {checking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {isVerified ? '확인됨' : '확인'}
            </Button>
          </div>
          {!isVerified && (
            <FieldDescription>
              인증번호를 입력한 뒤 확인까지 완료해야 가입할 수 있습니다.
            </FieldDescription>
          )}
          <FieldError errors={[errors.code]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="nickname">닉네임</FieldLabel>
          <div className="relative">
            <Input
              id="nickname"
              type="text"
              autoComplete="nickname"
              className="pr-11"
              aria-invalid={!!errors.nickname}
              {...register('nickname')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="
                absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground
                hover:text-foreground
                active:not-aria-[haspopup]:translate-y-[-50%]
              "
              aria-label="닉네임 랜덤 생성"
              title="닉네임 랜덤 생성"
              onClick={handleGenerateNickname}
            >
              <Dices className="size-4" />
            </Button>
          </div>
          <FieldError errors={[errors.nickname]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldDescription>
            비밀번호는 8자 이상 72자 이하로 입력해주세요.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
          <PasswordInput
            id="passwordConfirm"
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

        <Button type="submit" size="lg" disabled={isSubmitting || !isVerified}>
          {isSubmitting
            ? '가입 중...'
            : isVerified
              ? '이메일로 시작하기'
              : '인증번호 확인 후 시작하기'}
        </Button>
      </FieldGroup>
    </form>
  );
}
