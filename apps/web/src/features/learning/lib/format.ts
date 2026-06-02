import type { SolveSession } from '@/features/learning/types';

export function formatSolveMode(mode: SolveSession['mode']) {
  return mode === 'ONE_BY_ONE' ? '한 문제씩 풀기' : '한번에 풀기';
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

export function formatClock(date: Date) {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
