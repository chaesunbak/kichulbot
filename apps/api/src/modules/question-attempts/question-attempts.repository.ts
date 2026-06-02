import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class QuestionAttemptsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByUserAndRange(userId: string, from: Date, toExclusive: Date) {
    return this.db.questionAttempt.findMany({
      where: {
        userId,
        gradedAt: {
          gte: from,
          lt: toExclusive,
        },
      },
      select: {
        id: true,
        sessionItemId: true,
        questionRevisionId: true,
        answerChoice: true,
        answerText: true,
        outcome: true,
        spentMilliseconds: true,
        gradedAt: true,
        questionRevision: {
          select: {
            questionId: true,
          },
        },
      },
      orderBy: { gradedAt: 'asc' },
    });
  }
}
