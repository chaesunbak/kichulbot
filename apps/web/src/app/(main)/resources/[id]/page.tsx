import { notFound } from 'next/navigation';

import { getPaper, type Paper } from '@/features/papers/api/server';
import { PaperActions } from '@/features/papers/components/paper-actions';
import { PaperCoverCard } from '@/features/papers/components/paper-cover-card';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let paper: Paper;
  try {
    paper = await getPaper(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <PaperCoverCard paper={paper} />
      </div>
      <p className="text-sm text-zinc-500">{paper.exam.name}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {paper.title}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {formatPaperSession(paper)} · {paper.questionCount}문항
      </p>
      <PaperActions paperId={paper.id} initialIsInLibrary={paper.isInLibrary} />
    </div>
  );
}
