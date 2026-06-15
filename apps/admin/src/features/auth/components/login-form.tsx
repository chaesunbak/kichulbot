import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { TextField } from '@/shared/components/form-fields';

import { login } from '../api';
import { loginSchema } from '../schemas';
import { useAuthStore } from '../store/use-auth-store';
import type { LoginValues } from '../types';

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const form = useForm<LoginValues>({
    resolver: standardSchemaResolver(loginSchema),
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
          <TextField
            control={form.control}
            name="email"
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
          />
          <TextField
            control={form.control}
            name="password"
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="8자 이상"
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
