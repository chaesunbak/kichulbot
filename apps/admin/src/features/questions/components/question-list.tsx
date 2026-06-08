import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { ImageIcon, Pencil } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export function QuestionList({
  questions,
  tags,
  isLoadingTags,
  addingTagQuestionId,
  editingQuestionId,
  onEdit,
  onAddTag,
}: {
  questions: AdminPaperQuestionResponse[];
  tags: TagResponse[];
  isLoadingTags: boolean;
  addingTagQuestionId: string | null;
  editingQuestionId: string | null;
  onEdit: (question: AdminPaperQuestionResponse) => void;
  onAddTag: (question: AdminPaperQuestionResponse, tagId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">등록 문항</CardTitle>
        <CardDescription>
          태그가 없는 문항은 목록에서 바로 태그를 추가할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div
            className="
              rounded-md border border-dashed px-4 py-16 text-center text-sm
              text-muted-foreground
            "
          >
            아직 등록된 문항이 없습니다.
          </div>
        ) : (
          <div
            className="
              grid gap-3
              sm:grid-cols-2
            "
          >
            {questions.map((question) => (
              <div
                key={question.id}
                className={cn(
                  `
                    cursor-pointer rounded-md border bg-background p-4 text-left
                    transition-colors
                    hover:bg-muted/50
                  `,
                  editingQuestionId === question.id &&
                    'border-primary bg-primary/5',
                )}
                role="button"
                tabIndex={0}
                onClick={() => onEdit(question)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEdit(question);
                  }
                }}
              >
                {question.imageUrl ? (
                  <img
                    className="
                      mb-3 h-36 w-full rounded-md border bg-muted/30
                      object-contain
                    "
                    src={question.imageUrl}
                    alt={`${question.number}번 문항 이미지`}
                  />
                ) : (
                  <div
                    className="
                      mb-3 flex h-36 items-center justify-center rounded-md
                      border border-dashed bg-muted/30 text-xs
                      text-muted-foreground
                    "
                  >
                    <ImageIcon className="mr-1.5 size-4" />
                    등록 이미지 없음
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{question.number}번 문항</p>
                      <Badge variant="outline">
                        {question.type === 'MULTIPLE_CHOICE'
                          ? '객관식'
                          : '서술형'}
                      </Badge>
                      <Badge variant="secondary">{question.points}점</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getAnswerSummary(question)}
                    </p>
                  </div>
                  <Pencil className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {question.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                  <QuestionTagSelect
                    question={question}
                    tags={tags}
                    isLoading={isLoadingTags}
                    isPending={addingTagQuestionId === question.id}
                    onAddTag={onAddTag}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionTagSelect({
  question,
  tags,
  isLoading,
  isPending,
  onAddTag,
}: {
  question: AdminPaperQuestionResponse;
  tags: TagResponse[];
  isLoading: boolean;
  isPending: boolean;
  onAddTag: (question: AdminPaperQuestionResponse, tagId: string) => void;
}) {
  const selectedTagIds = new Set(question.tags.map((tag) => tag.id));
  const availableTags = tags.filter((tag) => !selectedTagIds.has(tag.id));

  if (isLoading) {
    return (
      <span className="text-xs text-muted-foreground">태그 불러오는 중</span>
    );
  }

  if (availableTags.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        추가 가능한 태그 없음
      </span>
    );
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Select
        value=""
        disabled={isPending}
        onValueChange={(tagId) => onAddTag(question, tagId)}
      >
        <SelectTrigger
          className="h-8 w-[160px] text-xs"
          aria-label={`${question.number}번 문항 태그 추가`}
        >
          <SelectValue placeholder={isPending ? '추가 중' : '태그 선택'} />
        </SelectTrigger>
        <SelectContent>
          {availableTags.map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {formatTagOption(tag)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatTagOption(tag: TagResponse) {
  if (!tag.tagGroup) return tag.name;
  return `${tag.tagGroup.name} · ${tag.name}`;
}

function getAnswerSummary(question: AdminPaperQuestionResponse) {
  return question.type === 'MULTIPLE_CHOICE'
    ? `정답 ${question.answerChoice ?? '-'}번 · 선택지 ${question.choiceCount ?? '-'}개`
    : `모범답안 ${question.answerText ?? '-'}`;
}
