import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/server';

export default async function SolveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <div
      className="
        flex h-dvh w-full items-center justify-center overflow-hidden bg-zinc-50
        p-2
      "
    >
      {children}
    </div>
  );
}
