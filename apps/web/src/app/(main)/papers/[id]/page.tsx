import { notFound } from 'next/navigation';
import { PaperActions } from '@/components/paper-actions';
import { PaperCoverCard } from '@/components/paper-cover-card';
import { formatPaperSession } from '@/lib/paper-labels';
import { getPaper, type Paper } from '@/lib/papers';

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
      <p className="text-sm text-zinc-500">
        {paper.exam.name} · {paper.subject.name}
      </p>
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
