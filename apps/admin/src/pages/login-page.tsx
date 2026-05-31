import { LoginForm } from '@/features/auth/components/login-form';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-10">
      <LoginForm />
    </main>
  );
}
