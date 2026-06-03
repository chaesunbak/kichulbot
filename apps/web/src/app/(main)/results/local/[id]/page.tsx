import { LocalResultSessionLoader } from '@/features/learning/components/local-result-session-loader';

export default async function LocalResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalResultSessionLoader id={id} />;
}
