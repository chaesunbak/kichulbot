import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '../../infrastructure/database/database.service';

const tagInclude = {
  _count: {
    select: { questions: true },
  },
};

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  findManyAvailable(examId?: string) {
    return this.db.tag.findMany({
      where: {
        ...(examId ? { examId } : {}),
      },
      include: tagInclude,
      orderBy: { name: 'asc' },
    });
  }

  findMany() {
    return this.db.tag.findMany({
      include: tagInclude,
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.tag.findUnique({
      where: { id },
      include: tagInclude,
    });
  }

  countAssignableByIds(tagIds: string[], examId: string) {
    return this.db.tag.count({
      where: {
        id: { in: tagIds },
        examId,
      },
    });
  }

  async existsExamById(examId: string) {
    const count = await this.db.exam.count({ where: { id: examId } });
    return count > 0;
  }

  create(data: Prisma.TagUncheckedCreateInput) {
    return this.db.tag.create({
      data,
      include: tagInclude,
    });
  }

  update(id: string, data: Prisma.TagUncheckedUpdateInput) {
    return this.db.$transaction(async (tx) => {
      if (typeof data.examId === 'string') {
        await tx.questionTag.deleteMany({
          where: {
            tagId: id,
            question: {
              paper: {
                examSession: {
                  examId: { not: data.examId },
                },
              },
            },
          },
        });
      }

      return tx.tag.update({
        where: { id },
        data,
        include: tagInclude,
      });
    });
  }

  async deleteIfUnused(id: string) {
    return this.db.$transaction(async (tx) => {
      const tag = await tx.tag.findUnique({
        where: { id },
        include: tagInclude,
      });

      if (!tag) {
        return { tag: null, questionCount: 0 };
      }

      const questionCount = tag._count.questions;
      if (questionCount > 0) {
        return { tag, questionCount };
      }

      await tx.tag.delete({ where: { id } });

      return { tag, questionCount };
    });
  }
}
