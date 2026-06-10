import { getToken } from '@/features/auth/server';
import GlobalFooter from '@/shared/components/global-footer';
import MainHeader from '@/shared/components/main-header';
import { MobileBottomNavigation } from '@/shared/components/main-navigation';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getToken();

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader isAuthenticated={Boolean(token)} />
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
