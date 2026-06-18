import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class QuestionAttemptsRepository {
  constructor(private readonly db: DatabaseService) {}

  findByUserAndRange(
    userId: string,
    from: Date,
    toExclusive: Date,
    includeTags = false,
  ) {
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
            ...(includeTags
              ? {
                  question: {
                    select: {
                      tags: {
                        select: {
                          tag: {
                            select: {
                              id: true,
                              name: true,
                              keywords: true,
                              sortOrder: true,
                              tagGroup: {
                                select: {
                                  id: true,
                                  examId: true,
                                  name: true,
                                  selectionMode: true,
                                  sortOrder: true,
                                  isActive: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                }
              : {}),
          },
        },
      },
      orderBy: { gradedAt: 'asc' },
    });
  }
}
