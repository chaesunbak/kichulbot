import type { CreatePaperWithQuestionsRequest } from '@kichulbot/api-contract/papers';

import type { CreatePaperInput } from '../api/client/mutations';
import type {
  ImportPaperQuestionValues,
  ImportPaperValues,
  PaperValues,
} from '../types';

export function toCreatePaperInput(
  values: PaperValues,
  exam: { usesMonth: boolean; usesGrade: boolean; usesRound: boolean },
): CreatePaperInput {
  return {
    ...values,
    month: exam.usesMonth ? (values.month ?? undefined) : undefined,
    grade: exam.usesGrade ? (values.grade ?? undefined) : undefined,
    round: exam.usesRound ? (values.round ?? undefined) : undefined,
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
      month: exam.usesMonth ? (values.month ?? undefined) : undefined,
      grade: exam.usesGrade ? (values.grade ?? undefined) : undefined,
      round: exam.usesRound ? (values.round ?? undefined) : undefined,
      examId: values.examId,
      questionCount: values.questionCount,
      isPublished: values.isPublished,
    },
    questions: includedQuestions.map((question) => ({
      number: question.number,
      type: question.type,
      gradingPolicy: question.gradingPolicy,
      choiceCount: question.choiceCount,
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      rawText: question.rawText,
      promptText: question.promptText,
      passageText: question.passageText,
      choiceTexts: question.choiceTexts,
      points: question.points,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      recommendedTagIds: question.recommendedTagIds,
      recommendedTagMatches: question.recommendedTagMatches,
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
