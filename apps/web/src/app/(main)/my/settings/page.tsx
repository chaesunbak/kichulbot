import { AccountSettingsCard } from '@/features/auth/components/account-settings-card';
import { ThemeSettingsCard } from '@/features/auth/components/theme-settings-card';
import { requireAuth } from '@/features/auth/lib/server-auth';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function SettingsPage() {
  const { user } = await requireAuth('/my/settings');

  return (
    <PageContainer>
      <PageTitle>설정</PageTitle>
      <ThemeSettingsCard />
      <AccountSettingsCard user={user} />
    </PageContainer>
  );
}
