import type { StudyWeeklyGoalResponseEnvelope } from '@kichulbot/api-contract/study-weekly-goals';
import { ConflictException, Injectable } from '@nestjs/common';

import { StudyWeeklyGoalsRepository } from './study-weekly-goals.repository';

const DEFAULT_TARGET_DAYS = 5;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

@Injectable()
export class StudyWeeklyGoalsService {
  constructor(
    private readonly studyWeeklyGoalsRepository: StudyWeeklyGoalsRepository,
  ) {}

  async getCurrent(
    userId: string,
    now = new Date(),
  ): Promise<StudyWeeklyGoalResponseEnvelope> {
    const currentWeekStartDate = this.getCurrentWeekStartDate(now);
    const currentWeekStart = this.toDateOnly(currentWeekStartDate);
    const goal = await this.studyWeeklyGoalsRepository.findByUserAndWeek(
      userId,
      currentWeekStart,
    );

    return {
      goal: {
        targetDays: goal?.targetDays ?? DEFAULT_TARGET_DAYS,
        effectiveWeekStartDate:
          goal?.effectiveWeekStartDate.toISOString().slice(0, 10) ??
          currentWeekStartDate,
        currentWeekStartDate,
        isConfigured: Boolean(goal),
      },
    };
  }

  async updateCurrent(
    userId: string,
    targetDays: number,
    now = new Date(),
  ): Promise<StudyWeeklyGoalResponseEnvelope> {
    const currentWeekStartDate = this.getCurrentWeekStartDate(now);
    const effectiveWeekStartDate = this.toDateOnly(currentWeekStartDate);
    const existing = await this.studyWeeklyGoalsRepository.findByUserAndWeek(
      userId,
      effectiveWeekStartDate,
    );

    if (existing) {
      throw new ConflictException('이번 주 학습 목표는 이미 설정했습니다.');
    }

    const goal = await this.studyWeeklyGoalsRepository.createCurrentWeekGoal({
      userId,
      effectiveWeekStartDate,
      targetDays,
    });

    return {
      goal: {
        targetDays: goal.targetDays,
        effectiveWeekStartDate: goal.effectiveWeekStartDate
          .toISOString()
          .slice(0, 10),
        currentWeekStartDate,
        isConfigured: true,
      },
    };
  }

  private getCurrentWeekStartDate(now: Date) {
    const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
    const mondayOffset = (kstNow.getUTCDay() + 6) % 7;
    kstNow.setUTCDate(kstNow.getUTCDate() - mondayOffset);
    return kstNow.toISOString().slice(0, 10);
  }

  private toDateOnly(date: string) {
    return new Date(`${date}T00:00:00.000Z`);
  }
}
