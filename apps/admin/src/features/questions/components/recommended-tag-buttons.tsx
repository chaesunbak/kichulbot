import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/ui/button';

import {
  getRecommendedTagKeywords,
  getUnselectedRecommendedTags,
} from '../lib/recommended-tags';

export function RecommendedTagButtons({
  question,
  tags,
  selectedTagIds,
  onApply,
}: {
  question: AdminPaperQuestionResponse;
  tags: TagResponse[];
  selectedTagIds: string[];
  onApply: (tag: TagResponse) => void;
}) {
  const recommendedTags = getUnselectedRecommendedTags({
    question,
    tags,
    selectedTagIds,
  });

  if (recommendedTags.length === 0) return null;

  return (
    <div className="mb-3 space-y-2 rounded-md border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">추천 태그</p>
      <div className="flex flex-wrap gap-2">
        {recommendedTags.map((tag) => {
          const matchedKeywords = getRecommendedTagKeywords(question, tag);

          return (
            <Button
              key={tag.id}
              className="h-auto items-start py-2 text-left"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApply(tag)}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span>{tag.name}</span>
                {matchedKeywords.length > 0 && (
                  <span className="max-w-56 truncate text-xs font-normal text-muted-foreground">
                    근거: {matchedKeywords.join(', ')}
                  </span>
                )}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
