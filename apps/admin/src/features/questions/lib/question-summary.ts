import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';

export function formatTagOption(tag: TagResponse) {
  if (!tag.tagGroup) return tag.name;
  return `${tag.tagGroup.name} · ${tag.name}`;
}

export function getAnswerSummary(question: AdminPaperQuestionResponse) {
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
