import type { SolveSessionLog } from '@/features/learning/types';
import { toKstDateString } from '@/features/question-attempts/lib/streak-date';
import type {
  QuestionAttempt,
  QuestionAttemptTagGroup,
} from '@/features/question-attempts/types';

export interface RecapTrendPoint {
  date: string;
  label: string;
  accuracyRate: number | null;
  solvedCount: number;
  correctCount: number;
  totalCount: number;
}

export interface RecapWeaknessTagPoint {
  tagId: string;
  tagName: string;
  weaknessCount: number;
  weaknessRate: number;
  accuracyRate: number;
  correctCount: number;
  incorrectCount: number;
  omittedCount: number;
  totalCount: number;
}

export interface RecapWeaknessGroup {
  group: QuestionAttemptTagGroup;
  tags: RecapWeaknessTagPoint[];
}

const MAX_TREND_POINTS = 30;

export function getRecapTrendPoints(logs: SolveSessionLog[]) {
  const statsByDate = new Map<
    string,
    {
      correctCount: number;
      totalCount: number;
    }
  >();

  for (const log of logs) {
    if (!log.submittedAt || !log.result) continue;

    const date = toKstDateString(new Date(log.submittedAt));
    const stats = statsByDate.get(date) ?? { correctCount: 0, totalCount: 0 };

    stats.correctCount += log.result.correctCount;
    stats.totalCount += log.result.totalCount;
    statsByDate.set(date, stats);
  }

  return Array.from(statsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MAX_TREND_POINTS)
    .map(([date, stats]) => ({
      date,
      label: formatDateLabel(date),
      accuracyRate:
        stats.totalCount > 0
          ? Math.round((stats.correctCount / stats.totalCount) * 1000) / 10
          : null,
      solvedCount: stats.totalCount,
      correctCount: stats.correctCount,
      totalCount: stats.totalCount,
    }));
}

export function getRecapWeaknessGroups(attempts: QuestionAttempt[]) {
  const groups = new Map<
    string,
    {
      group: QuestionAttemptTagGroup;
      tags: Map<
        string,
        {
          tagName: string;
          correctCount: number;
          incorrectCount: number;
          omittedCount: number;
          totalCount: number;
        }
      >;
    }
  >();

  for (const attempt of attempts) {
    for (const tag of attempt.tags ?? []) {
      if (!tag.tagGroup?.isActive) continue;

      const groupStats =
        groups.get(tag.tagGroup.id) ??
        ({
          group: tag.tagGroup,
          tags: new Map(),
        } satisfies {
          group: QuestionAttemptTagGroup;
          tags: Map<
            string,
            {
              tagName: string;
              correctCount: number;
              incorrectCount: number;
              omittedCount: number;
              totalCount: number;
            }
          >;
        });
      const tagStats = groupStats.tags.get(tag.id) ?? {
        tagName: tag.name,
        correctCount: 0,
        incorrectCount: 0,
        omittedCount: 0,
        totalCount: 0,
      };

      tagStats.totalCount += 1;
      if (attempt.outcome === 'CORRECT') {
        tagStats.correctCount += 1;
      } else if (attempt.outcome === 'INCORRECT') {
        tagStats.incorrectCount += 1;
      } else {
        tagStats.omittedCount += 1;
      }

      groupStats.tags.set(tag.id, tagStats);
      groups.set(tag.tagGroup.id, groupStats);
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => {
      const sortOrder = a.group.sortOrder - b.group.sortOrder;
      return sortOrder || a.group.name.localeCompare(b.group.name);
    })
    .map(({ group, tags }) => ({
      group,
      tags: Array.from(tags.entries())
        .map(([tagId, stats]) => {
          const weaknessCount = stats.incorrectCount + stats.omittedCount;
          return {
            tagId,
            tagName: stats.tagName,
            weaknessCount,
            weaknessRate: roundRate(weaknessCount, stats.totalCount),
            accuracyRate: roundRate(stats.correctCount, stats.totalCount),
            correctCount: stats.correctCount,
            incorrectCount: stats.incorrectCount,
            omittedCount: stats.omittedCount,
            totalCount: stats.totalCount,
          };
        })
        .sort((a, b) => {
          const weaknessCount = b.weaknessCount - a.weaknessCount;
          if (weaknessCount) return weaknessCount;
          const weaknessRate = b.weaknessRate - a.weaknessRate;
          return weaknessRate || a.tagName.localeCompare(b.tagName);
        }),
    }))
    .filter(({ tags }) => tags.length > 0);
}

function roundRate(count: number, totalCount: number) {
  if (totalCount === 0) return 0;
  return Math.round((count / totalCount) * 1000) / 10;
}

function formatDateLabel(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}/${Number(day)}`;
}
