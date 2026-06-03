import { redirect } from 'next/navigation';
import { normalizeNextPath } from '@/features/auth/lib/next-path';

type EmailRegisterPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function EmailRegisterPage({
  searchParams,
}: EmailRegisterPageProps) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params?.next);
  redirect(`/register/email?next=${encodeURIComponent(nextPath)}`);
}
