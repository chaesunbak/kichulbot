import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';

import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
import type { AuthUser } from '@/features/auth/types';

import { DeleteAccountButton } from './delete-account-button';
import { KakaoAuthButton } from './kakao-auth-button';
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
        <div className="flex flex-wrap gap-2">
          {!user.linkedProviders.includes('KAKAO') && (
            <div className="w-full max-w-52">
              <KakaoAuthButton href={getKakaoAuthStartPath('link')}>
                카카오 연결
              </KakaoAuthButton>
            </div>
          )}
          <LogoutButton />
          <DeleteAccountButton />
        </div>
      </CardContent>
    </Card>
  );
}
