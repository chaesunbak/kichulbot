import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import Link from 'next/link';

import { DeleteAccountButton } from '@/features/auth/components/delete-account-button';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function SettingsPage() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <PageContainer>
      <PageTitle>설정</PageTitle>
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user.authType === 'ANONYMOUS' && (
              <Button asChild>
                <Link href="/register">계정 만들기</Link>
              </Button>
            )}
            <LogoutButton />
            <DeleteAccountButton />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
