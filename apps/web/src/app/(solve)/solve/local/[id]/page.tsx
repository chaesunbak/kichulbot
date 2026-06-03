import { LocalSolveSessionLoader } from '@/features/learning/components/local-solve-session-loader';

export default async function LocalSolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalSolveSessionLoader id={id} />;
}
