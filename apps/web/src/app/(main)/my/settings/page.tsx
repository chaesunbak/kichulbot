import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { KakaoAuthButton } from '@/features/auth/components/kakao-auth-button';
import { DeleteAccountButton } from '@/features/auth/components/delete-account-button';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';
import { getCachedUser } from '@/features/auth/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function SettingsPage() {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/my/settings');

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
            {user.authType === 'ANONYMOUS' ? (
              <div className="w-full max-w-52">
                <KakaoAuthButton href={getKakaoAuthStartPath('convert')}>
                  카카오로 계정 만들기
                </KakaoAuthButton>
              </div>
            ) : (
              !user.linkedProviders.includes('KAKAO') && (
                <div className="w-full max-w-44">
                  <KakaoAuthButton href={getKakaoAuthStartPath('link')}>
                    카카오 연결
                  </KakaoAuthButton>
                </div>
              )
            )}
            <LogoutButton />
            <DeleteAccountButton />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
