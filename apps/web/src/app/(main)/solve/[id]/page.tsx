import { notFound } from 'next/navigation';
import { SolveSession } from '@/components/solve-session';
import { getAnswerSession, type AnswerSession } from '@/lib/learning';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let session: AnswerSession;
  try {
    session = await getAnswerSession(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-semibold text-zinc-900">
        {session.paper.title}
      </h1>
      <SolveSession initialSession={session} />
    </div>
  );
}
