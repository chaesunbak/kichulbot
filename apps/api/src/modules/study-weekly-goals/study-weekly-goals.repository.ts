import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class StudyWeeklyGoalsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByUserAndWeek(userId: string, effectiveWeekStartDate: Date) {
    return this.db.studyWeeklyGoal.findUnique({
      where: {
        userId_effectiveWeekStartDate: {
          userId,
          effectiveWeekStartDate,
        },
      },
    });
  }

  createCurrentWeekGoal({
    userId,
    effectiveWeekStartDate,
    targetDays,
  }: {
    userId: string;
    effectiveWeekStartDate: Date;
    targetDays: number;
  }) {
    return this.db.studyWeeklyGoal.create({
      data: {
        userId,
        effectiveWeekStartDate,
        targetDays,
      },
    });
  }
}
