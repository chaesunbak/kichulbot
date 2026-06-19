import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import type { Prisma } from '../../infrastructure/database/prisma-client';

@Injectable()
export class StudyActivityRepository {
  constructor(private readonly db: DatabaseService) {}

  findUserActivitySessions(userId: string, from: Date, toExclusive: Date) {
    return this.db.solveSession.findMany({
      where: {
        userId,
        ...this.activityRangeWhere(from, toExclusive),
      },
      select: {
        items: {
          select: {
            draft: {
              select: { spentMilliseconds: true },
            },
          },
        },
      },
    });
  }

  findActivityUsers(from: Date, toExclusive: Date) {
    return this.db.solveSession.findMany({
      where: this.activityRangeWhere(from, toExclusive),
      distinct: ['userId'],
      select: { userId: true },
    });
  }

  findSubmittedActivityDates(userId: string) {
    return this.db.solveSession.findMany({
      where: {
        userId,
        submittedAt: { not: null },
      },
      select: { submittedAt: true },
    });
  }

  findDraftActivityDates(userId: string) {
    return this.db.draftResponse.findMany({
      where: {
        sessionItem: {
          session: { userId },
        },
      },
      select: { updatedAt: true },
    });
  }

  private activityRangeWhere(from: Date, toExclusive: Date) {
    return {
      OR: [
        { submittedAt: { gte: from, lt: toExclusive } },
        {
          items: {
            some: {
              draft: {
                is: { updatedAt: { gte: from, lt: toExclusive } },
              },
            },
          },
        },
      ],
    } satisfies Prisma.SolveSessionWhereInput;
  }
}
