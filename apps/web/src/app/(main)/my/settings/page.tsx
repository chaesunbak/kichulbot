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

export default async function SettingsPage() {
  const user = await getCachedUser();
  if (!user) return null;

  return (
    <PageContainer className="flex max-w-5xl flex-col">
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">설정</h1>

      <Card className="mt-6">
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
