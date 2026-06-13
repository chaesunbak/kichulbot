import { notFound } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getPaperQuestions } from '@/features/papers/api/server/queries';
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

  let data: Awaited<ReturnType<typeof getPaperQuestions>>;
  try {
    data = await getPaperQuestions(id);
  } catch {
    notFound();
  }

  const user = await getCachedUser();

  return (
    <PaperQuestionViewer
      paper={data.paper}
      questions={data.questions}
      initialQuestionNumber={
        Number.isFinite(questionNumber) ? questionNumber : 1
      }
      isAuthenticated={!!user}
    />
  );
}
