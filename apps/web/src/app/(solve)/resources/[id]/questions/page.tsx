import { notFound } from 'next/navigation';

import { getToken } from '@/features/auth/api/server/queries';
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

  const token = await getToken();

  return (
    <PaperQuestionViewer
      paper={data.paper}
      questions={data.questions}
      initialQuestionNumber={
        Number.isFinite(questionNumber) ? questionNumber : 1
      }
      isAuthenticated={!!token}
    />
  );
}
