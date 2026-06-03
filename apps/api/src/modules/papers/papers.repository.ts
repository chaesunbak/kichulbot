import { Injectable } from '@nestjs/common';
import {
  Prisma,
  QuestionSetKind,
} from '../../infrastructure/database/prisma-client';

import { DatabaseService } from '../../infrastructure/database/database.service';

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
      orderBy: [
        { examSession: { displayYear: 'desc' } },
        { examSession: { month: 'desc' } },
        { createdAt: 'desc' },
      ],
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
            tags: { include: { tag: true } },
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.PaperUncheckedUpdateInput) {
    return this.db.paper.update({
      where: { id },
      data,
      include: this.paperIncludes(),
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
}
