import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';

import { ProfileForm } from '@/features/auth/components/profile-form';
import { getUser } from '@/features/auth/server';

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) return null;

  return (
    <div
      className="
        mx-auto flex w-full max-w-2xl flex-col px-4 py-8
        sm:px-6 sm:py-10
      "
    >
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">프로필 수정</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm email={user.email} nickname={user.nickname ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
