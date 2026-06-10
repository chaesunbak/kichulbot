'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { PasswordInput } from '@kichulbot/ui/components/password-input';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { generateRandomNickname } from '@kichulbot/utils';
import { Check, Dices, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  ApiError,
  confirmEmailVerificationApi,
  registerWithEmailApi,
  requestEmailVerificationApi,
} from '@/features/auth/api/client';
import { rememberRecentLogin } from '@/features/auth/lib/recent-login';
import { emailRegisterSchema } from '@/features/auth/schemas';
import type { EmailRegisterFormValues } from '@/features/auth/types';

export function EmailRegisterForm() {
  const router = useRouter();
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [initialNickname] = useState(() => generateRandomNickname());
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const trackedFieldsRef = useRef<Set<keyof EmailRegisterFormValues>>(
    new Set(),
  );

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailRegisterFormValues>({
    resolver: standardSchemaResolver(emailRegisterSchema),
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
  const getRegisterProgress = () => {
    const values = getValues();

    return {
      method: 'email',
      has_email: !!values.email?.trim(),
      has_code: !!values.code?.trim(),
      has_nickname: !!values.nickname?.trim(),
      has_password: !!values.password,
      has_password_confirm: !!values.passwordConfirm,
      email_verified: isVerified,
    };
  };
  const captureFieldStarted = (field: keyof EmailRegisterFormValues) => {
    if (trackedFieldsRef.current.has(field)) return;

    trackedFieldsRef.current.add(field);
    posthog.capture('email_register_field_started', {
      field,
      ...getRegisterProgress(),
    });
  };

  useEffect(() => {
    posthog.capture('email_register_viewed', { method: 'email' });
  }, []);

  const handleSendCode = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) {
      posthog.capture('email_register_verification_request_blocked', {
        reason: 'invalid_email',
        ...getRegisterProgress(),
      });
      return;
    }

    const email = getValues('email').trim().toLowerCase();

    setSending(true);
    setServerError(null);
    setVerifiedEmail(null);
    setVerificationToken(null);
    posthog.capture('email_register_verification_requested', {
      ...getRegisterProgress(),
    });
    try {
      await requestEmailVerificationApi(email);
      posthog.capture('email_register_verification_sent', {
        ...getRegisterProgress(),
      });
      toast.success('인증번호를 발송했습니다.');
    } catch (error) {
      posthog.capture('email_register_verification_failed', {
        error_type: error instanceof ApiError ? 'api_error' : 'unknown_error',
        ...getRegisterProgress(),
      });
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
    if (!isCodeValid) {
      posthog.capture('email_register_code_confirmation_blocked', {
        reason: 'invalid_code_form',
        ...getRegisterProgress(),
      });
      return;
    }

    const email = getValues('email').trim().toLowerCase();
    const code = getValues('code').trim();

    setChecking(true);
    setServerError(null);
    posthog.capture('email_register_code_confirmation_requested', {
      ...getRegisterProgress(),
    });
    try {
      const response = await confirmEmailVerificationApi({ email, code });
      if (!response.emailVerificationToken) {
        throw new Error('이메일 인증 응답이 올바르지 않습니다.');
      }
      setVerifiedEmail(email);
      setVerificationToken(response.emailVerificationToken);
      posthog.capture('email_register_code_confirmed', {
        method: 'email',
        has_email: true,
        has_code: true,
        has_nickname: !!getValues('nickname')?.trim(),
        has_password: !!getValues('password'),
        has_password_confirm: !!getValues('passwordConfirm'),
        email_verified: true,
      });
    } catch (error) {
      posthog.capture('email_register_code_confirmation_failed', {
        error_type: error instanceof ApiError ? 'api_error' : 'unknown_error',
        ...getRegisterProgress(),
      });
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
    posthog.capture('email_register_nickname_generated', {
      ...getRegisterProgress(),
    });
  };

  const onSubmit = async (values: EmailRegisterFormValues) => {
    const email = values.email.trim().toLowerCase();
    if (!verificationToken || verifiedEmail !== email) {
      posthog.capture('email_register_submit_blocked', {
        reason: 'email_not_verified',
        ...getRegisterProgress(),
      });
      toast.error('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    setServerError(null);
    posthog.capture('email_register_submitted', {
      ...getRegisterProgress(),
    });
    try {
      const { user } = await registerWithEmailApi({
        email,
        password: values.password,
        nickname: values.nickname?.trim() || undefined,
        emailVerificationToken: verificationToken,
      });
      posthog.identify(user.id, { email: user.email, nickname: user.nickname });
      posthog.capture('user_registered', { method: 'email' });
      rememberRecentLogin({ method: 'email', email: user.email ?? email });
      router.push('/');
      router.refresh();
    } catch (error) {
      posthog.capture('email_register_failed', {
        error_type: error instanceof ApiError ? 'api_error' : 'unknown_error',
        ...getRegisterProgress(),
      });
      if (error instanceof Error) {
        posthog.captureException(error);
      }
      const message =
        error instanceof ApiError
          ? error.message
          : '회원가입 중 오류가 발생했습니다.';
      setServerError(message);
      toast.error(message);
    }
  };
  const onInvalid = () => {
    posthog.capture('email_register_submit_blocked', {
      reason: 'invalid_form',
      ...getRegisterProgress(),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="email">이메일</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              onFocus={() => captureFieldStarted('email')}
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
              onFocus={() => captureFieldStarted('code')}
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
              onFocus={() => captureFieldStarted('nickname')}
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
            onFocus={() => captureFieldStarted('password')}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
          <PasswordInput
            id="passwordConfirm"
            autoComplete="new-password"
            aria-invalid={!!errors.passwordConfirm}
            onFocus={() => captureFieldStarted('passwordConfirm')}
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
