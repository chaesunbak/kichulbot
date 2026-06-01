import { redirect } from 'next/navigation';

import { getUser } from '@/lib/auth';

export default async function SolveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  return (
    <div className="h-dvh overflow-hidden bg-zinc-50 p-2 justify-center items-center flex w-full">
      {children}
    </div>
  );
}
