import { redirect } from 'next/navigation';

import { getCurrentUserOrNull } from '@/features/auth/api/server/queries';
import { AccountSettingsCard } from '@/features/auth/components/account-settings-card';
import { ThemeSettingsCard } from '@/features/auth/components/theme-settings-card';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function SettingsPage() {
  const user = await getCurrentUserOrNull();
  if (!user) redirect('/login?next=/my/settings');

  return (
    <PageContainer>
      <PageTitle>설정</PageTitle>
      <ThemeSettingsCard />
      <AccountSettingsCard user={user} />
    </PageContainer>
  );
}
