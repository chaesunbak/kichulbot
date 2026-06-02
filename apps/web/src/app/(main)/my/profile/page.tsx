import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';

import { ProfileForm } from '@/features/auth/components/profile-form';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function ProfilePage() {
  const user = await getCachedUser();
  if (!user) return null;

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
