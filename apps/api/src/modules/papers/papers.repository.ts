import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  Prisma,
  QuestionSetKind,
} from '../../infrastructure/database/prisma-client';
import { findBookmarkedQuestionIds } from '../shared/repository/bookmarked-question-ids';

interface CreatePaperInput {
  title: string;
  examId: string;
  displayYear: number;
  month: number | null;
  grade: number | null;
  round: number | null;
  questionCount: number;
  isPublished: boolean;
}

interface UpdatePaperInput {
  title?: string;
  displayYear?: number;
  month?: number | null;
  grade?: number | null;
  round?: number | null;
  isPublished?: boolean;
}

@Injectable()
export class PapersRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: CreatePaperInput) {
    return this.db.$transaction(async (tx) => {
      const { examId, displayYear, month, grade, round, ...paper } = data;
      const sessionWhere = { examId, displayYear, month, grade, round };
      const key = [examId, displayYear, month, grade, round]
        .map((value) => value ?? '-')
        .join(':');
      const session = await tx.examSession.upsert({
        where: { key },
        create: { key, ...sessionWhere },
        update: {},
      });
      const questionSet = await tx.questionSet.create({
        data: { kind: QuestionSetKind.OFFICIAL_PAPER, title: paper.title },
      });

      return tx.paper.create({
        data: {
          ...paper,
          examSessionId: session.id,
          questionSetId: questionSet.id,
        },
        include: this.paperIncludes(),
      });
    });
  }

  findMany(where: Prisma.PaperWhereInput, userId?: string) {
    return this.db.paper.findMany({
      where,
      include: this.paperIncludes(userId),
      orderBy: this.paperOrderBy(),
    });
  }

  findManyForList(where: Prisma.PaperWhereInput, userId?: string) {
    return this.db.paper.findMany({
      where,
      select: this.paperListSelect(userId),
      orderBy: this.paperOrderBy(),
    });
  }

  findById(id: string, where: Prisma.PaperWhereInput = {}, userId?: string) {
    return this.db.paper.findFirst({
      where: {
        ...where,
        id,
      },
      include: {
        ...this.paperIncludes(userId),
        questions: {
          orderBy: { number: 'asc' },
          include: {
            revisions: {
              orderBy: { revision: 'desc' },
              take: 1,
            },
            tags: { include: { tag: { include: { tagGroup: true } } } },
          },
        },
      },
    });
  }

  async findBookmarkedQuestionIds(userId: string, questionIds: string[]) {
    return findBookmarkedQuestionIds(this.db, userId, questionIds);
  }

  update(id: string, data: UpdatePaperInput) {
    return this.db.$transaction(async (tx) => {
      const paper = await tx.paper.findUniqueOrThrow({
        where: { id },
        include: { examSession: true },
      });
      const { displayYear, month, grade, round, ...paperData } = data;
      const shouldUpdateSession =
        displayYear !== undefined ||
        month !== undefined ||
        grade !== undefined ||
        round !== undefined;

      let examSessionId: string | undefined;
      if (shouldUpdateSession) {
        const nextSession = {
          examId: paper.examSession.examId,
          displayYear: displayYear ?? paper.examSession.displayYear,
          month: month ?? paper.examSession.month,
          grade: grade ?? paper.examSession.grade,
          round: round ?? paper.examSession.round,
        };
        const key = [
          nextSession.examId,
          nextSession.displayYear,
          nextSession.month,
          nextSession.grade,
          nextSession.round,
        ]
          .map((value) => value ?? '-')
          .join(':');
        const session = await tx.examSession.upsert({
          where: { key },
          create: { key, ...nextSession },
          update: {},
        });
        examSessionId = session.id;
      }

      if (paperData.title !== undefined) {
        await tx.questionSet.update({
          where: { id: paper.questionSetId },
          data: { title: paperData.title },
        });
      }

      return tx.paper.update({
        where: { id },
        data: {
          ...paperData,
          ...(examSessionId ? { examSessionId } : {}),
        },
        include: this.paperIncludes(),
      });
    });
  }

  countQuestionAttempts(id: string) {
    return this.db.questionAttempt.count({
      where: {
        questionRevision: {
          question: { paperId: id },
        },
      },
    });
  }

  delete(id: string) {
    return this.db.$transaction(async (tx) => {
      const paper = await tx.paper.delete({ where: { id } });
      await tx.questionSet.delete({ where: { id: paper.questionSetId } });
      return paper;
    });
  }

  private paperIncludes(userId?: string) {
    return {
      examSession: { include: { exam: true } },
      questions: true,
      users: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
    } satisfies Prisma.PaperInclude;
  }

  private paperListSelect(userId?: string) {
    return {
      id: true,
      title: true,
      questionCount: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      examSession: {
        select: {
          displayYear: true,
          month: true,
          grade: true,
          round: true,
          exam: true,
        },
      },
      _count: { select: { questions: true } },
      users: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
    } satisfies Prisma.PaperSelect;
  }

  private paperOrderBy() {
    return [
      { examSession: { displayYear: 'desc' } },
      { examSession: { month: 'desc' } },
      { examSession: { round: 'desc' } },
      { createdAt: 'desc' },
    ] satisfies Prisma.PaperOrderByWithRelationInput[];
  }
}
