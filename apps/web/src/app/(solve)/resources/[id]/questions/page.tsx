import { notFound } from 'next/navigation';

import { auth } from '@/features/auth/lib/server-auth';
import { getPublicPaperQuestions } from '@/features/papers/api/server/queries';
import { PaperQuestionViewer } from '@/features/papers/components/paper-question-viewer';

export default async function PaperQuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ question?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const questionNumber = Number(query.question ?? 1);

  let data: Awaited<ReturnType<typeof getPublicPaperQuestions>>;
  try {
    data = await getPublicPaperQuestions(id);
  } catch {
    notFound();
  }

  const session = await auth();

  return (
    <PaperQuestionViewer
      paper={data.paper}
      questions={data.questions}
      initialQuestionNumber={
        Number.isFinite(questionNumber) ? questionNumber : 1
      }
      isAuthenticated={!!session}
    />
  );
}
