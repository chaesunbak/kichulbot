import type { GetRecapSummaryResponse } from '@kichulbot/api-contract/recap';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AttemptOutcome } from '../../infrastructure/database/prisma-client';
import type { LatestQuestionAttemptOutcome } from './recap.repository';
import { RecapRepository } from './recap.repository';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class RecapService {
  constructor(private readonly recapRepository: RecapRepository) {}

  async getSummary(
    userId: string,
    now = new Date(),
  ): Promise<GetRecapSummaryResponse> {
    const user = await this.recapRepository.findUserTimezone(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const studyDate = this.toDateString(now, user.timezone);
    const { from, toExclusive } = this.toDateRange(studyDate, user.timezone);
    const [sessions, wrongQuestionSet, latestAttemptOutcomes] =
      await Promise.all([
        this.recapRepository.findSubmittedSolveSessions(
          userId,
          from,
          toExclusive,
        ),
        this.recapRepository.findDailyWrongQuestionSetSummary(
          userId,
          this.toDateOnly(studyDate),
        ),
        this.recapRepository.findLatestQuestionAttemptOutcomes(userId),
      ]);
    const wrongQuestionCount = this.countWrongReviewCandidates(
      latestAttemptOutcomes,
    );

    return {
      studyDate,
      todayStats: this.toTodayStats(sessions),
      wrongReview: wrongQuestionSet
        ? {
            questionSetId: wrongQuestionSet.id,
            questionCount: wrongQuestionCount,
            generatedAt:
              wrongQuestionSet.generated?.generatedAt.toISOString() ?? null,
          }
        : {
            questionSetId: null,
            questionCount: wrongQuestionCount,
            generatedAt: null,
          },
    };
  }

  private countWrongReviewCandidates(attempts: LatestQuestionAttemptOutcome[]) {
    const latestByQuestion = new Map<string, LatestQuestionAttemptOutcome>();
    for (const attempt of attempts) {
      const { questionId } = attempt.questionRevision;
      if (!latestByQuestion.has(questionId)) {
        latestByQuestion.set(questionId, attempt);
      }
    }

    return [...latestByQuestion.values()].filter(
      (attempt) => attempt.outcome !== AttemptOutcome.CORRECT,
    ).length;
  }

  private toTodayStats(
    sessions: Array<{
      items: Array<{
        attempts: Array<{ outcome: AttemptOutcome }>;
      }>;
    }>,
  ) {
    const stats = sessions.reduce(
      (acc, session) => {
        for (const item of session.items) {
          const latestAttempt = item.attempts.at(-1);
          acc.totalCount += 1;

          if (
            !latestAttempt ||
            latestAttempt.outcome === AttemptOutcome.OMITTED
          ) {
            acc.omittedCount += 1;
          } else if (latestAttempt.outcome === AttemptOutcome.CORRECT) {
            acc.correctCount += 1;
          } else {
            acc.incorrectCount += 1;
          }
        }

        return acc;
      },
      {
        correctCount: 0,
        incorrectCount: 0,
        omittedCount: 0,
        totalCount: 0,
      },
    );

    return {
      ...stats,
      accuracyRate:
        stats.totalCount > 0
          ? Math.round((stats.correctCount / stats.totalCount) * 100)
          : 0,
    };
  }

  private toDateString(date: Date, timezone: string) {
    const parts = this.formatToParts(date, timezone);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  private toDateRange(date: string, timezone: string) {
    this.assertDateOnly(date);
    const from = this.toUtcDateTime(date, '00:00:00', timezone);
    const toExclusive = this.toUtcDateTime(
      this.addDays(date, 1),
      '00:00:00',
      timezone,
    );
    return { from, toExclusive };
  }

  private toDateOnly(date: string) {
    this.assertDateOnly(date);
    return new Date(`${date}T00:00:00.000Z`);
  }

  private toUtcDateTime(date: string, time: string, timezone: string) {
    const localAsUtc = new Date(`${date}T${time}.000Z`);
    const firstPass = new Date(
      localAsUtc.getTime() - this.getTimeZoneOffset(localAsUtc, timezone),
    );
    return new Date(
      localAsUtc.getTime() - this.getTimeZoneOffset(firstPass, timezone),
    );
  }

  private getTimeZoneOffset(date: Date, timezone: string) {
    const parts = this.formatToParts(date, timezone);
    const zonedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    return zonedAsUtc - date.getTime();
  }

  private formatToParts(date: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;

    return {
      year: get('year') ?? '0000',
      month: get('month') ?? '00',
      day: get('day') ?? '00',
      hour: get('hour') ?? '00',
      minute: get('minute') ?? '00',
      second: get('second') ?? '00',
    };
  }

  private addDays(date: string, days: number) {
    this.assertDateOnly(date);
    const next = new Date(`${date}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  }

  private assertDateOnly(date: string) {
    if (!DATE_PATTERN.test(date)) {
      throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
  }
}
