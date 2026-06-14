import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import { MyProfileCard } from '@/features/auth/components/my-profile-card';
import { MySettingsCard } from '@/features/auth/components/my-settings-card';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function MyPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/my');

  return (
    <PageContainer className="min-h-[calc(100svh-16rem)]">
      <PageTitle>마이 페이지</PageTitle>
      <section
        className="
          mt-6 grid gap-4
          lg:grid-cols-[minmax(0,1fr)_20rem]
        "
      >
        <MyProfileCard user={user} />
        <MySettingsCard />
      </section>
    </PageContainer>
  );
}
