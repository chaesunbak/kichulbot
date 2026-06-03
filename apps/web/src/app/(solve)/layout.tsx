import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';

export default async function SolveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect('/login');

  return (
    <div
      className="
        flex h-dvh w-full items-center justify-center overflow-hidden
        bg-background p-2
      "
    >
      {children}
    </div>
  );
}
