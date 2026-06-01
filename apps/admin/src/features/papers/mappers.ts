import type { CreatePaperInput } from './api';
import type { PaperValues } from './schemas';

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
