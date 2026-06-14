import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';

export function getUnselectedRecommendedTags({
  question,
  tags,
  selectedTagIds,
}: {
  question: AdminPaperQuestionResponse;
  tags: TagResponse[];
  selectedTagIds: string[];
}) {
  const selectedTagIdSet = new Set(selectedTagIds);
  return question.recommendedTagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is TagResponse => Boolean(tag))
    .filter((tag) => !selectedTagIdSet.has(tag.id));
}

export function getRecommendedTagKeywords(
  question: AdminPaperQuestionResponse,
  tag: TagResponse,
) {
  const savedMatch = question.recommendedTagMatches.find(
    (match) => match.tagId === tag.id,
  );
  if (savedMatch && savedMatch.keywords.length > 0) {
    return savedMatch.keywords;
  }

  const haystack = normalizeForKeywordMatch(
    [
      question.rawText,
      question.promptText,
      question.passageText,
      ...question.choiceTexts,
    ].join('\n'),
  );
  if (!haystack) return [];

  return tag.keywords.filter((keyword) => {
    const normalizedKeyword = normalizeForKeywordMatch(keyword);
    return Boolean(normalizedKeyword) && haystack.includes(normalizedKeyword);
  });
}

function normalizeForKeywordMatch(value: string) {
  return value.toLowerCase().replace(/\s+/g, '');
}
