import Link from 'next/link';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { getAnswerSessionLogs } from '@/lib/learning';

export default async function RecapPage() {
  const logs = await getAnswerSessionLogs();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">복습</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">풀이 기록</h1>
      <p className="mt-2 text-sm text-zinc-500">
        풀었던 자료와 결과를 다시 확인해 보세요.
      </p>
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
                    · {log.correctCount}/{log.answeredCount} 정답 ·{' '}
                    {formatDuration(log.totalSpentMilliseconds)}
                  </CardDescription>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 w-fit"
                  >
                    <Link href={`/solve/${log.id}`}>결과 보기</Link>
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
