import type {
  ActiveUsersResponse,
  StudyStreakResponse,
  StudyTimeResponse,
} from '@kichulbot/api-contract/study-activity';
import { BadRequestException, Injectable } from '@nestjs/common';

import { StudyActivityRepository } from './study-activity.repository';

const KST_OFFSET = '+09:00';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class StudyActivityService {
  constructor(
    private readonly studyActivityRepository: StudyActivityRepository,
  ) {}

  async getStudyTime(
    userId: string,
    dateInput?: string,
    now = new Date(),
  ): Promise<StudyTimeResponse> {
    const date = this.resolveDate(dateInput, now);
    const { from, toExclusive } = this.toKstDateRange(date);
    const sessions =
      await this.studyActivityRepository.findUserActivitySessions(
        userId,
        from,
        toExclusive,
      );

    return {
      date,
      spentMilliseconds: sessions.reduce((sessionTotal, session) => {
        return (
          sessionTotal +
          session.items.reduce((itemTotal, item) => {
            return itemTotal + (item.draft?.spentMilliseconds ?? 0);
          }, 0)
        );
      }, 0),
    };
  }

  async getStudyStreak(
    userId: string,
    now = new Date(),
  ): Promise<StudyStreakResponse> {
    const [submittedDates, draftDates] = await Promise.all([
      this.studyActivityRepository.findSubmittedActivityDates(userId),
      this.studyActivityRepository.findDraftActivityDates(userId),
    ]);
    const activityDates = new Set<string>();

    for (const session of submittedDates) {
      if (session.submittedAt) {
        activityDates.add(this.toKstDateString(session.submittedAt));
      }
    }
    for (const draft of draftDates) {
      activityDates.add(this.toKstDateString(draft.updatedAt));
    }

    let currentDate = this.toKstDateString(now);
    let currentStreakDays = 0;
    while (activityDates.has(currentDate)) {
      currentStreakDays += 1;
      currentDate = this.addDays(currentDate, -1);
    }

    return { currentStreakDays };
  }

  async getActiveUsers(
    dateInput?: string,
    now = new Date(),
  ): Promise<ActiveUsersResponse> {
    const date = this.resolveDate(dateInput, now);
    const { from, toExclusive } = this.toKstDateRange(date);
    const users = await this.studyActivityRepository.findActivityUsers(
      from,
      toExclusive,
    );

    return { date, activeUserCount: users.length };
  }

  private resolveDate(dateInput: string | undefined, now: Date) {
    if (!dateInput) return this.toKstDateString(now);
    this.assertDateOnly(dateInput);
    return dateInput;
  }

  private toKstDateRange(date: string) {
    this.assertDateOnly(date);
    const from = new Date(`${date}T00:00:00.000${KST_OFFSET}`);
    const toExclusive = new Date(from);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
    return { from, toExclusive };
  }

  private toKstDateString(date: Date) {
    return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
  }

  private addDays(date: string, days: number) {
    const next = new Date(`${date}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  }

  private assertDateOnly(date: string) {
    if (!DATE_PATTERN.test(date)) {
      throw new BadRequestException('날짜는 YYYY-MM-DD 형식이어야 합니다.');
    }
    const parsed = new Date(`${date}T00:00:00.000${KST_OFFSET}`);
    if (this.toKstDateString(parsed) !== date) {
      throw new BadRequestException('날짜가 올바른 날짜가 아닙니다.');
    }
  }
}
