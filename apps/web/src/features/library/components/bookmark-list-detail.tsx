'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import type { BookmarkList } from '@/features/learning/types';

export function BookmarkListDetail({
  initialList,
}: {
  initialList: BookmarkList;
}) {
  const [questions, setQuestions] = useState(initialList.questions);
  const [message, setMessage] = useState<string | null>(null);

  const removeQuestion = async (questionId: string) => {
    const response = await fetch(
      `/api/me/question-lists/${initialList.id}/questions/${questionId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) return setMessage('북마크를 제거하지 못했습니다.');
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );
    setMessage('북마크를 제거했습니다.');
  };

  if (questions.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500">아직 저장한 문제가 없습니다.</p>
    );
  }

  return (
    <>
      {message && <p className="mt-4 text-sm text-zinc-500">{message}</p>}
      <ul className="mt-6 grid gap-5">
        {questions.map((question) => (
          <li
            key={question.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-zinc-900">
                  {question.paper.title} {question.number}번
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {question.paper.examName} · {question.paper.subjectName} ·{' '}
                  {question.paper.year}학년도
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeQuestion(question.id)}
              >
                <Trash2 />
                제거
              </Button>
            </div>
            {question.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt={`${question.paper.title} ${question.number}번 문제`}
                className="mt-4 max-h-[560px] w-full rounded-lg object-contain"
              />
            ) : (
              <p className="mt-4 rounded-lg bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
                문제 이미지가 없습니다.
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
