import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';

import { QuestionTextBlock } from './question-text-block';

export function QuestionExtractedText({
  question,
}: {
  question: AdminPaperQuestionResponse;
}) {
  const hasText =
    Boolean(question.rawText) ||
    Boolean(question.promptText) ||
    Boolean(question.passageText) ||
    question.choiceTexts.length > 0;

  if (!hasText) {
    return (
      <section className="rounded-md border border-dashed p-4">
        <p className="text-sm font-medium">추출 텍스트</p>
        <p className="mt-1 text-xs text-muted-foreground">
          저장된 PDF 텍스트가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">추출 텍스트</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF 텍스트 레이어에서 문항별로 저장된 내용입니다.
          </p>
        </div>
        {question.choiceTexts.length > 0 && (
          <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
            선지 {question.choiceTexts.length}개
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4">
        {question.promptText && (
          <QuestionTextBlock title="발문" text={question.promptText} />
        )}
        {question.passageText && (
          <QuestionTextBlock title="지문" text={question.passageText} />
        )}
        {question.choiceTexts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">선지</p>
            <ol className="mt-2 grid gap-2">
              {question.choiceTexts.map((choiceText, index) => (
                <li
                  key={`${choiceText}-${index}`}
                  className="
                    rounded-md border bg-muted/20 px-3 py-2 text-sm/6
                     whitespace-pre-wrap
                  "
                >
                  {choiceText}
                </li>
              ))}
            </ol>
          </div>
        )}
        {question.rawText && (
          <QuestionTextBlock title="전체 원문" text={question.rawText} />
        )}
      </div>
    </section>
  );
}
