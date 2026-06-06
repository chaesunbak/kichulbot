import {
  formatDuration,
  formatRelativeDate,
  formatSolveMode,
} from '@/features/learning/lib/format';
import type { SolveSessionLog } from '@/features/learning/types';

export function getSolveSessionLogHref(log: SolveSessionLog) {
  return log.submittedAt ? `/results/${log.id}` : `/solve/${log.id}`;
}

export function getSolveSessionLogActionLabel(log: SolveSessionLog) {
  return log.submittedAt ? '결과 보기' : '이어 풀기';
}

export function getSolveSessionLogRelativeDate(log: SolveSessionLog) {
  return formatRelativeDate(log.submittedAt ?? log.updatedAt);
}

export function formatSolveSessionLogCompactMeta(log: SolveSessionLog) {
  return `${log.paper.questionCount} 문항 · ${formatSolveMode(log.mode)} · ${getSolveSessionLogRelativeDate(log)}`;
}

export function formatSolveSessionLogDetailMeta(log: SolveSessionLog) {
  const progressMeta = log.result
    ? `${log.result.score}점 · ${log.result.correctCount}/${log.result.totalCount} 정답 · ${formatDuration(
        log.result.totalSpentMilliseconds,
      )}`
    : `${formatDuration(log.totalSpentMilliseconds)} · 풀이 중`;

  return `${formatSolveMode(log.mode)} · ${progressMeta} · ${getSolveSessionLogRelativeDate(
    log,
  )}`;
}
