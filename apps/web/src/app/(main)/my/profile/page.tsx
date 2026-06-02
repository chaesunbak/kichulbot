import { Card, CardContent } from '@kichulbot/ui/components/card';

import { ProfileForm } from '@/features/auth/components/profile-form';
import { getUser } from '@/features/auth/server';

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) return null;

  return (
    <div
      className="
        mx-auto flex max-w-6xl flex-col px-4 py-8
        sm:px-6 sm:py-10
      "
    >
      <Card className="mt-6 max-w-xl">
        <CardContent>
          <ProfileForm nickname={user.nickname ?? ''} />
        </CardContent>
      </Card>
    </div>
  );
}
