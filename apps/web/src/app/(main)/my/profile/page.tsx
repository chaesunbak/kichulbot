import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { redirect } from 'next/navigation';

import { ProfileForm } from '@/features/auth/components/profile-form';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function ProfilePage() {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/my/profile');

  return (
    <PageContainer>
      <PageTitle>프로필 수정</PageTitle>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm email={user.email} nickname={user.nickname ?? ''} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
