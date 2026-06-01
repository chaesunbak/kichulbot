import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';

interface ExamCreateData {
  name: string;
  categoryIds: string[];
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
}

interface ExamUpdateData {
  name?: string;
  categoryIds?: string[];
  usesMonth?: boolean;
  usesGrade?: boolean;
  usesRound?: boolean;
}

const examInclude = {
  categories: { include: { category: true } },
  sessions: {
    select: {
      _count: {
        select: { papers: true },
      },
    },
  },
};

@Injectable()
export class ExamsRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.exam.findMany({
      include: examInclude,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.exam.findUnique({
      where: { id },
      include: examInclude,
    });
  }

  create(data: ExamCreateData) {
    return this.db.exam.create({
      data: {
        name: data.name,
        usesMonth: data.usesMonth,
        usesGrade: data.usesGrade,
        usesRound: data.usesRound,
        categories: {
          create: data.categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      },
      include: examInclude,
    });
  }

  update(id: string, data: ExamUpdateData) {
    return this.db.exam.update({
      where: { id },
      data: {
        name: data.name,
        usesMonth: data.usesMonth,
        usesGrade: data.usesGrade,
        usesRound: data.usesRound,
        ...(data.categoryIds
          ? {
              categories: {
                deleteMany: {},
                create: data.categoryIds.map((categoryId) => ({
                  category: { connect: { id: categoryId } },
                })),
              },
            }
          : {}),
      },
      include: examInclude,
    });
  }

  async deleteIfNoPapers(id: string) {
    return this.db.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({
        where: { id },
        include: examInclude,
      });

      if (!exam) {
        return { exam: null, paperCount: 0 };
      }

      const paperCount = exam.sessions.reduce(
        (sum, session) => sum + session._count.papers,
        0,
      );

      if (paperCount > 0) {
        return { exam, paperCount };
      }

      await tx.examSession.deleteMany({ where: { examId: id } });
      await tx.exam.delete({ where: { id } });

      return { exam, paperCount };
    });
  }
}
