import type { Answer, SolveSession } from '@/features/learning/types';

export function getResumeQuestionIndex(session: SolveSession) {
  const questionIndexById = new Map(
    session.paper.questions.map((question, index) => [question.id, index]),
  );
  const latestAnswer = session.answers.reduce<Answer | null>(
    (latest, answer) => {
      if (!questionIndexById.has(answer.questionId)) return latest;
      if (!latest) return answer;

      return Date.parse(answer.updatedAt) > Date.parse(latest.updatedAt)
        ? answer
        : latest;
    },
    null,
  );

  if (latestAnswer) {
    return questionIndexById.get(latestAnswer.questionId) ?? 0;
  }

  const firstUnansweredIndex = session.paper.questions.findIndex(
    (question) =>
      !session.answers.some(
        (answer) =>
          answer.questionId === question.id &&
          (answer.answerChoice !== null || answer.answerText !== null),
      ),
  );

  return firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
}
