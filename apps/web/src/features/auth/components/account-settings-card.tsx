import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Separator } from '@kichulbot/ui/components/ui/separator';
import Link from 'next/link';

import type { AuthUser } from '@/features/auth/types';

import { DeleteAccountButton } from './delete-account-button';
import { KakaoConnectionAction } from './kakao-connection-action';
import { LogoutButton } from './logout-button';

interface AccountSettingsCardProps {
  user: AuthUser;
}

export function AccountSettingsCard({ user }: AccountSettingsCardProps) {
  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle>계정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">이메일</div>

              {user.authMethods.includes('EMAIL') ? (
                <p className="text-sm text-muted-foreground">
                  {user.email ?? '이메일'}
                </p>
              ) : (
                <Button
                  asChild
                  variant="link"
                  className="h-auto justify-start p-0"
                >
                  <Link href="/my/settings/email">연결하기</Link>
                </Button>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="text-sm font-medium">카카오</div>
              <KakaoConnectionAction user={user} />
            </div>
          </section>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <LogoutButton />
            <DeleteAccountButton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
