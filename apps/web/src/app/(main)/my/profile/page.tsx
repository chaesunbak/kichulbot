import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';

import { ProfileForm } from '@/features/auth/components/profile-form';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';

export default async function ProfilePage() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <PageContainer className="flex max-w-2xl flex-col">
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">프로필 수정</h1>

      <Card className="mt-6">
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
