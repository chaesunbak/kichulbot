import type { AdminPaperQuestion } from '@/shared/types';
import type { Tag } from '@/shared/types';

export function formatTagOption(tag: Tag) {
  if (!tag.tagGroup) return tag.name;
  return `${tag.tagGroup.name} · ${tag.name}`;
}

export function getAnswerSummary(question: AdminPaperQuestion) {
  if (
    question.type === 'MULTIPLE_CHOICE' &&
    question.gradingPolicy === 'ANY_CHOICE'
  ) {
    return `정답없음 · 선택지 ${question.choiceCount ?? '-'}개`;
  }
  return question.type === 'MULTIPLE_CHOICE'
    ? `정답 ${question.answerChoice ?? '-'}번 · 선택지 ${question.choiceCount ?? '-'}개`
    : `모범답안 ${question.answerText ?? '-'}`;
}
