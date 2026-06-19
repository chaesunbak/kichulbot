import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import { QuestionSetKind } from '../../infrastructure/database/prisma-client';

@Injectable()
export class RecapRepository {
  constructor(private readonly db: DatabaseService) {}

  findUserTimezone(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
  }

  findSubmittedSolveSessions(userId: string, from: Date, toExclusive: Date) {
    return this.db.solveSession.findMany({
      where: {
        userId,
        submittedAt: { gte: from, lt: toExclusive },
        OR: [
          { sourceSetId: null },
          { sourceSet: { is: { kind: { not: QuestionSetKind.DAILY_WRONG } } } },
        ],
      },
      select: {
        items: {
          select: {
            attempts: {
              orderBy: { gradedAt: 'asc' },
              select: { outcome: true },
            },
          },
        },
      },
    });
  }

  findDailyWrongQuestionSetSummary(userId: string, studyDate: Date) {
    return this.db.questionSet.findFirst({
      where: {
        ownerUserId: userId,
        kind: QuestionSetKind.DAILY_WRONG,
        generated: { is: { studyDate } },
      },
      select: {
        id: true,
        generated: {
          select: { generatedAt: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });
  }
}
