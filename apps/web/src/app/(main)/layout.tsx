import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import GlobalFooter from '@/shared/components/global-footer';
import MainHeader from '@/shared/components/main-header';
import { MobileBottomNavigation } from '@/shared/components/main-navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect('/login');

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader user={user} />
      <main
        className="
          flex-1 pb-20
          md:pb-0
        "
      >
        {children}
      </main>
      <MobileBottomNavigation />
      <GlobalFooter />
    </div>
  );
}
