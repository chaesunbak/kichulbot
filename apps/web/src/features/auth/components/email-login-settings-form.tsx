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
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Check, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  configureEmailLoginApi,
  confirmMyEmailVerificationApi,
  requestMyEmailVerificationApi,
} from '@/features/auth/api/client/mutations';
import { emailLoginSettingsSchema } from '@/features/auth/schemas';
import type { EmailLoginSettingsFormValues } from '@/features/auth/types';

interface EmailLoginSettingsFormProps {
  email: string | null;
}

export function EmailLoginSettingsForm({ email }: EmailLoginSettingsFormProps) {
  const router = useRouter();
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmailLoginSettingsFormValues>({
    resolver: standardSchemaResolver(emailLoginSettingsSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: email ?? '',
      code: '',
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

    const targetEmail = getValues('email').trim().toLowerCase();
    setSending(true);
    setVerifiedEmail(null);
    setVerificationToken(null);

    try {
      await requestMyEmailVerificationApi(targetEmail);
      toast.success('인증번호를 보냈습니다.');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : '인증번호를 보내지 못했습니다.',
      );
    } finally {
      setSending(false);
    }
  };

  const handleConfirmCode = async () => {
    const isFormValid = await trigger(['email', 'code']);
    if (!isFormValid) return;

    const targetEmail = getValues('email').trim().toLowerCase();
    setChecking(true);

    try {
      const response = await confirmMyEmailVerificationApi({
        email: targetEmail,
        code: getValues('code').trim(),
      });
      setVerifiedEmail(targetEmail);
      setVerificationToken(response.emailVerificationToken);
      toast.success('이메일을 확인했습니다.');
    } catch (error) {
      setVerificationToken(null);
      toast.error(
        error instanceof ApiError
          ? error.message
          : '인증번호를 확인하지 못했습니다.',
      );
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (values: EmailLoginSettingsFormValues) => {
    if (!verificationToken || !isVerified) {
      toast.error('이메일 인증을 완료해주세요.');
      return;
    }

    try {
      await configureEmailLoginApi({
        emailVerificationToken: verificationToken,
        password: values.password,
      });
      toast.success('이메일 로그인을 설정했습니다.');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : '이메일 로그인을 설정하지 못했습니다.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="settingsEmail">이메일</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="settingsEmail"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email', {
                onChange: () => {
                  setVerifiedEmail(null);
                  setVerificationToken(null);
                },
              })}
            />
            <Button
              type="button"
              variant="outline"
              disabled={sending || isSubmitting}
              onClick={handleSendCode}
            >
              {sending ? <Loader2 className="animate-spin" /> : <Mail />}
              인증번호
            </Button>
          </div>
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="settingsEmailCode">인증번호</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="settingsEmailCode"
              inputMode="numeric"
              maxLength={6}
              aria-invalid={!!errors.code}
              {...register('code')}
            />
            <Button
              type="button"
              variant={isVerified ? 'secondary' : 'outline'}
              disabled={checking || isSubmitting || isVerified}
              onClick={handleConfirmCode}
            >
              {checking ? <Loader2 className="animate-spin" /> : <Check />}
              확인
            </Button>
          </div>
          <FieldError errors={[errors.code]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="settingsPassword">비밀번호</FieldLabel>
          <PasswordInput
            id="settingsPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="settingsPasswordConfirm">
            비밀번호 확인
          </FieldLabel>
          <PasswordInput
            id="settingsPasswordConfirm"
            autoComplete="new-password"
            aria-invalid={!!errors.passwordConfirm}
            {...register('passwordConfirm')}
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting || !isVerified}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        이메일 로그인 설정
      </Button>
    </form>
  );
}
