import type { CreatePaperWithQuestionsRequest } from '@kichulbot/api-contract/papers';

import type { CreatePaperInput } from './api';
import type {
  ImportPaperQuestionValues,
  ImportPaperValues,
  PaperValues,
} from './types';

export function toCreatePaperInput(
  values: PaperValues,
  exam: { usesMonth: boolean; usesGrade: boolean; usesRound: boolean },
): CreatePaperInput {
  return {
    ...values,
    month: exam.usesMonth ? values.month : undefined,
    grade: exam.usesGrade ? values.grade : undefined,
    round: exam.usesRound ? values.round : undefined,
    isPublished: values.isPublished === 'true',
  };
}

export function toCreatePaperWithQuestionsInput(
  values: ImportPaperValues,
  exam: { usesMonth: boolean; usesGrade: boolean; usesRound: boolean },
  questions: ImportPaperQuestionValues[],
): CreatePaperWithQuestionsRequest {
  const includedQuestions = questions.filter((question) => !question.excluded);

  return {
    paper: {
      title: values.title,
      year: values.year,
      month: exam.usesMonth ? values.month : undefined,
      grade: exam.usesGrade ? values.grade : undefined,
      round: exam.usesRound ? values.round : undefined,
      examId: values.examId,
      questionCount: values.questionCount,
      isPublished: values.isPublished,
    },
    questions: includedQuestions.map((question) => ({
      number: question.number,
      type: question.type,
      choiceCount: question.choiceCount,
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      points: question.points,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tagIds: question.tagIds,
      imageFileName: question.image.filename,
    })),
  };
}

export function toCreatePaperQuestionImages(
  questions: ImportPaperQuestionValues[],
) {
  return questions
    .filter((question) => !question.excluded)
    .map((question) => imageToFile(question.image));
}

function imageToFile(image: ImportPaperQuestionValues['image']) {
  const bytes = Uint8Array.from(atob(image.base64), (char) =>
    char.charCodeAt(0),
  );
  return new File([bytes], image.filename, { type: image.mimeType });
}
