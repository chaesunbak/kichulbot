import { Injectable } from '@nestjs/common';
import {
  AnswerMode,
  AttemptOutcome,
  Prisma,
  QuestionRevision,
  QuestionSetKind,
} from '@prisma/client';

import { DatabaseService } from '../../infrastructure/database/database.service';

export class SubmittedSolveSessionError extends Error {}

@Injectable()
export class SolveSessionsRepository {
  constructor(private readonly db: DatabaseService) {}

  findPublishedPaper(paperId: string) {
    return this.db.paper.findFirst({
      where: { id: paperId, isPublished: true },
    });
  }

  start(userId: string, paperId: string, mode: AnswerMode) {
    return this.db.$transaction(async (tx) => {
      const paper = await tx.paper.findUniqueOrThrow({
        where: { id: paperId },
      });
      return this.startQuestionSetTransaction(
        tx,
        userId,
        paper.questionSetId,
        mode,
      );
    });
  }

  startQuestionSet(userId: string, questionSetId: string, mode: AnswerMode) {
    return this.db.$transaction((tx) =>
      this.startQuestionSetTransaction(tx, userId, questionSetId, mode),
    );
  }

  private async startQuestionSetTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    questionSetId: string,
    mode: AnswerMode,
  ) {
    const questionSet = await tx.questionSet.findFirstOrThrow({
      where: {
        id: questionSetId,
        OR: [{ ownerUserId: userId }, { paper: { is: { isPublished: true } } }],
      },
      include: {
        paper: true,
        items: { orderBy: { position: 'asc' } },
      },
    });
    const existing = await tx.solveSession.findFirst({
      where: { userId, sourceSetId: questionSetId, mode, submittedAt: null },
      include: this.sessionIncludes(),
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    return tx.solveSession.create({
      data: {
        userId,
        paperId: questionSet.paper?.id,
        sourceSetId: questionSet.id,
        mode,
        items: {
          create: questionSet.items.map((item) => ({
            questionRevisionId: item.questionRevisionId,
            position: item.position,
          })),
        },
      },
      include: this.sessionIncludes(),
    });
  }

  findById(id: string) {
    return this.db.solveSession.findUnique({
      where: { id },
      include: this.sessionIncludes(),
    });
  }

  findLogs(userId: string) {
    return this.db.solveSession.findMany({
      where: { userId },
      include: this.sessionIncludes(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  saveAnswer(
    sessionId: string,
    sessionItemId: string,
    data: {
      answerChoice?: number | null;
      answerText?: string | null;
      spentMilliseconds?: number;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "SolveSession" WHERE "id" = ${sessionId} FOR UPDATE`;
      const item = await tx.solveSessionItem.findFirstOrThrow({
        where: { id: sessionItemId, sessionId },
        include: {
          questionRevision: true,
          session: { include: { sourceSet: true } },
        },
      });
      if (item.session.submittedAt) throw new SubmittedSolveSessionError();

      const { spentMilliseconds = 0, ...answer } = data;
      const draft = await tx.draftResponse.upsert({
        where: { sessionItemId },
        create: { sessionItemId, spentMilliseconds, ...answer },
        update: {
          ...answer,
          spentMilliseconds: { increment: spentMilliseconds },
        },
      });
      const attempt =
        this.shouldCreateAttempts(item.session) &&
        item.session.mode === AnswerMode.ONE_BY_ONE &&
        this.hasAnswer(answer)
          ? await tx.questionAttempt.create({
              data: {
                userId: item.session.userId,
                sessionItemId,
                questionRevisionId: item.questionRevisionId,
                answerChoice: draft.answerChoice,
                answerText: draft.answerText,
                outcome: this.toOutcome(item.questionRevision, draft),
                spentMilliseconds: draft.spentMilliseconds,
              },
            })
          : null;

      return { draft, attempt };
    });
  }

  submit(id: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "SolveSession" WHERE "id" = ${id} FOR UPDATE`;
      const session = await tx.solveSession.findUniqueOrThrow({
        where: { id },
        include: this.sessionIncludes(),
      });
      if (session.submittedAt) return session;

      const attempts = !this.shouldCreateAttempts(session)
        ? []
        : session.mode === AnswerMode.EXAM
          ? session.items.map((item) => ({
              userId: session.userId,
              sessionItemId: item.id,
              questionRevisionId: item.questionRevisionId,
              answerChoice: item.draft?.answerChoice,
              answerText: item.draft?.answerText,
              outcome: this.toOutcome(item.questionRevision, item.draft),
              spentMilliseconds: item.draft?.spentMilliseconds ?? 0,
            }))
          : session.items
              .filter((item) => item.attempts.length === 0)
              .map((item) => ({
                userId: session.userId,
                sessionItemId: item.id,
                questionRevisionId: item.questionRevisionId,
                answerChoice: null,
                answerText: null,
                outcome: AttemptOutcome.OMITTED,
                spentMilliseconds: item.draft?.spentMilliseconds ?? 0,
              }));

      if (attempts.length > 0) {
        await tx.questionAttempt.createMany({ data: attempts });
      }

      return tx.solveSession.update({
        where: { id },
        data: { submittedAt: new Date() },
        include: this.sessionIncludes(),
      });
    });
  }

  private sessionIncludes() {
    return {
      paper: {
        include: {
          examSession: { include: { exam: true } },
        },
      },
      sourceSet: true,
      items: {
        include: {
          questionRevision: { include: { question: true } },
          draft: true,
          attempts: { orderBy: { gradedAt: 'asc' as const } },
        },
        orderBy: { position: 'asc' as const },
      },
    } satisfies Prisma.SolveSessionInclude;
  }

  private hasAnswer(answer?: {
    answerChoice?: number | null;
    answerText?: string | null;
  }) {
    return answer?.answerChoice != null || answer?.answerText != null;
  }

  private shouldCreateAttempts(session: {
    sourceSet?: { kind: QuestionSetKind } | null;
  }) {
    return session.sourceSet?.kind !== QuestionSetKind.DAILY_WRONG;
  }

  private toOutcome(
    question: QuestionRevision,
    answer?: { answerChoice: number | null; answerText: string | null } | null,
  ) {
    if (!answer || !this.hasAnswer(answer)) return AttemptOutcome.OMITTED;
    const isCorrect =
      question.type === 'MULTIPLE_CHOICE'
        ? answer.answerChoice === question.answerChoice
        : answer.answerText?.trim() === question.answerText?.trim();
    return isCorrect ? AttemptOutcome.CORRECT : AttemptOutcome.INCORRECT;
  }
}
