import { redirect } from 'next/navigation';

import { EmailLoginSettingsForm } from '@/features/auth/components/email-login-settings-form';
import { requireAuth } from '@/features/auth/lib/server-auth';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function EmailSettingsPage() {
  const { user } = await requireAuth('/my/settings/email');
  if (user.authMethods.includes('EMAIL')) {
    redirect('/my/settings');
  }

  return (
    <PageContainer className="mx-auto w-full max-w-sm">
      <PageTitle>이메일 연결</PageTitle>
      <EmailLoginSettingsForm email={user.email} />
    </PageContainer>
  );
}
