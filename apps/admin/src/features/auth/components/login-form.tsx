import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { login } from '../api';
import { loginSchema, type LoginValues } from '../schemas';
import { useAuthStore } from '../store';

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const mutation = useMutation({
    mutationFn: ({ email, password }: LoginValues) => login(email, password),
    onSuccess: (data) => {
      if (data.user.role !== 'ADMIN') {
        toast.error('관리자 권한이 있는 계정으로 로그인해 주세요.');
        return;
      }
      setAuth(data.accessToken, data.user);
      toast.success('로그인했습니다.');
      navigate('/', { replace: true });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '로그인에 실패했습니다.',
      ),
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>기출봇 관리자</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>이메일</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  placeholder="admin@example.com"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>비밀번호</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  placeholder="8자 이상"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button
            className="w-full"
            type="submit"
            disabled={mutation.isPending}
          >
            로그인
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
