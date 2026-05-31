import { Injectable } from '@nestjs/common';
import { AnswerMode, Prisma } from '@prisma/client';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class AnswerSessionsRepository {
  constructor(private readonly db: DatabaseService) {}

  findPublishedPaper(paperId: string) {
    return this.db.paper.findFirst({
      where: { id: paperId, isPublished: true },
    });
  }

  start(userId: string, paperId: string, mode: AnswerMode) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.answerSession.findFirst({
        where: { userId, paperId, mode, submittedAt: null },
        include: this.sessionIncludes(),
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return existing;

      return tx.answerSession.create({
        data: { userId, paperId, mode },
        include: this.sessionIncludes(),
      });
    });
  }

  findById(id: string) {
    return this.db.answerSession.findUnique({
      where: { id },
      include: this.sessionIncludes(),
    });
  }

  findLogs(userId: string) {
    return this.db.answerSession.findMany({
      where: { userId, submittedAt: { not: null } },
      include: this.sessionIncludes(),
      orderBy: { submittedAt: 'desc' },
    });
  }

  saveDraftAnswer(
    sessionId: string,
    questionId: string,
    data: {
      answerChoice?: number | null;
      answerText?: string | null;
      spentMilliseconds?: number;
    },
  ) {
    const { spentMilliseconds = 0, ...answer } = data;
    return this.db.draftAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: { sessionId, questionId, spentMilliseconds, ...answer },
      update: {
        ...answer,
        spentMilliseconds: { increment: spentMilliseconds },
      },
    });
  }

  submit(id: string) {
    return this.db.answerSession.update({
      where: { id },
      data: { submittedAt: new Date() },
      include: this.sessionIncludes(),
    });
  }

  private sessionIncludes() {
    return {
      paper: {
        include: {
          exam: true,
          subject: true,
          questions: { orderBy: { number: 'asc' as const } },
        },
      },
      draftAnswers: { orderBy: { createdAt: 'asc' as const } },
    } satisfies Prisma.AnswerSessionInclude;
  }
}
