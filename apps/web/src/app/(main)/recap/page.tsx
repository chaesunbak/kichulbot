import Link from 'next/link';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { WrongReviewCard } from '@/features/learning/components/wrong-review-card';
import {
  getSolveSessionLogs,
  getTodayWrongQuestions,
} from '@/features/learning/api/server';

export default async function RecapPage() {
  const [logs, wrongQuestionSet] = await Promise.all([
    getSolveSessionLogs(),
    getTodayWrongQuestions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">복습</h1>
      {wrongQuestionSet && (
        <WrongReviewCard initialQuestionSet={wrongQuestionSet} />
      )}

      {logs.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">종료한 풀이가 없습니다.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {logs.map((log) => (
            <li key={log.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{log.paper.title}</CardTitle>
                  <CardDescription>
                    {log.mode === 'ONE_BY_ONE'
                      ? '한 문제씩 풀기'
                      : '한번에 풀기'}{' '}
                    · {log.result.score}점 · {log.result.correctCount}/
                    {log.result.totalCount} 정답 ·{' '}
                    {formatDuration(log.result.totalSpentMilliseconds)}
                  </CardDescription>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 w-fit"
                  >
                    <Link href={`/results/${log.id}`}>결과 보기</Link>
                  </Button>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}
