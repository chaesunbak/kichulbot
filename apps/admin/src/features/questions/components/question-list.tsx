import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ImageIcon, Pencil } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export function QuestionList({
  questions,
  editingQuestionId,
  onEdit,
}: {
  questions: AdminPaperQuestionResponse[];
  editingQuestionId: string | null;
  onEdit: (question: AdminPaperQuestionResponse) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">등록 문항</CardTitle>
        <CardDescription>
          문항을 선택하면 번호, 정답, 태그와 이미지를 수정할 수 있습니다.
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
                <div className="mt-3 flex flex-wrap gap-1">
                  {question.tags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      태그 없음
                    </span>
                  ) : (
                    question.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getAnswerSummary(question: AdminPaperQuestionResponse) {
  return question.type === 'MULTIPLE_CHOICE'
    ? `정답 ${question.answerChoice ?? '-'}번 · 선택지 ${question.choiceCount ?? '-'}개`
    : `모범답안 ${question.answerText ?? '-'}`;
}
