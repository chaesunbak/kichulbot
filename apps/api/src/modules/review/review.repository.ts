import { Injectable } from '@nestjs/common';
import { AttemptOutcome, Prisma, QuestionSetKind } from '@prisma/client';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class ReviewRepository {
  constructor(private readonly db: DatabaseService) {}

  findUser(userId: string) {
    return this.db.user.findUnique({ where: { id: userId } });
  }

  findByStudyDate(userId: string, studyDate: Date) {
    return this.db.questionSet.findFirst({
      where: this.dailyWrongWhere(userId, studyDate),
      include: this.questionSetIncludes(),
    });
  }

  findOwnedDailyWrongQuestionSet(userId: string, questionSetId: string) {
    return this.db.questionSet.findFirst({
      where: {
        id: questionSetId,
        ownerUserId: userId,
        kind: QuestionSetKind.DAILY_WRONG,
      },
      include: this.questionSetIncludes(),
    });
  }

  async generate(userId: string, studyDate: Date) {
    const existing = await this.findByStudyDate(userId, studyDate);
    if (existing) return existing;

    try {
      return await this.db.$transaction(async (tx) => {
        const candidates = await this.findWrongCandidates(tx, userId);
        return tx.questionSet.create({
          data: {
            ownerUserId: userId,
            kind: QuestionSetKind.DAILY_WRONG,
            title: this.toTitle(studyDate),
            generated: {
              create: {
                ownerUserId: userId,
                kind: QuestionSetKind.DAILY_WRONG,
                studyDate,
                generatorVersion: 'daily-wrong-v1',
                parameters: this.toParameters(candidates.length),
              },
            },
            items: {
              create: candidates.map((attempt, index) => ({
                questionRevisionId: attempt.questionRevisionId,
                position: index + 1,
                sourceAttemptId: attempt.id,
                reason: { sourceOutcome: attempt.outcome },
              })),
            },
          },
          include: this.questionSetIncludes(),
        });
      });
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) throw error;
      return this.db.questionSet.findFirstOrThrow({
        where: this.dailyWrongWhere(userId, studyDate),
        include: this.questionSetIncludes(),
      });
    }
  }

  async regenerate(userId: string, studyDate: Date) {
    const existing = await this.findByStudyDate(userId, studyDate);
    if (!existing) return this.generate(userId, studyDate);

    return this.db.$transaction(async (tx) => {
      const candidates = await this.findWrongCandidates(tx, userId);
      return tx.questionSet.update({
        where: { id: existing.id },
        data: {
          items: {
            deleteMany: {},
            create: candidates.map((attempt, index) => ({
              questionRevisionId: attempt.questionRevisionId,
              position: index + 1,
              sourceAttemptId: attempt.id,
              reason: { sourceOutcome: attempt.outcome },
            })),
          },
          generated: {
            update: {
              generatedAt: new Date(),
              generatorVersion: 'daily-wrong-v1',
              parameters: this.toParameters(candidates.length),
            },
          },
        },
        include: this.questionSetIncludes(),
      });
    });
  }

  private dailyWrongWhere(userId: string, studyDate: Date) {
    return {
      ownerUserId: userId,
      kind: QuestionSetKind.DAILY_WRONG,
      generated: { is: { studyDate } },
    } satisfies Prisma.QuestionSetWhereInput;
  }

  private async findWrongCandidates(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const attempts = await tx.questionAttempt.findMany({
      where: { userId },
      include: { questionRevision: true },
      orderBy: [{ gradedAt: 'desc' }, { id: 'desc' }],
    });
    const latestByQuestion = new Map<string, (typeof attempts)[number]>();
    for (const attempt of attempts) {
      const { questionId } = attempt.questionRevision;
      if (!latestByQuestion.has(questionId)) {
        latestByQuestion.set(questionId, attempt);
      }
    }
    return [...latestByQuestion.values()].filter(
      (attempt) => attempt.outcome !== AttemptOutcome.CORRECT,
    );
  }

  private questionSetIncludes() {
    return {
      generated: true,
      items: {
        include: {
          sourceAttempt: true,
          questionRevision: {
            include: {
              question: {
                include: {
                  paper: {
                    include: {
                      examSession: { include: { exam: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { position: 'asc' as const },
      },
    } satisfies Prisma.QuestionSetInclude;
  }

  private toTitle(studyDate: Date) {
    const year = studyDate.getUTCFullYear();
    const month = studyDate.getUTCMonth() + 1;
    const date = studyDate.getUTCDate();

    return `${year}년 ${month}월 ${date}일 오늘의 오답`;
  }

  private toParameters(questionCount: number) {
    return {
      selection: 'latest-attempt-per-question',
      questionCount,
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
