import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  findManyAvailable(examId?: string) {
    return this.db.tag.findMany({
      where: {
        isActive: true,
        ...(examId ? { exams: { some: { examId } } } : {}),
      },
      include: { exams: true },
      orderBy: { name: 'asc' },
    });
  }

  findMany() {
    return this.db.tag.findMany({
      include: { exams: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.tag.findUnique({
      where: { id },
      include: { exams: true },
    });
  }

  countAssignableByIds(tagIds: string[], examId: string) {
    return this.db.tag.count({
      where: {
        id: { in: tagIds },
        isActive: true,
        exams: { some: { examId } },
      },
    });
  }

  countExamsByIds(examIds: string[]) {
    return this.db.exam.count({ where: { id: { in: examIds } } });
  }

  create(data: Prisma.TagCreateInput, examIds: string[]) {
    return this.db.tag.create({
      data: {
        ...data,
        exams: {
          create: examIds.map((examId) => ({ examId })),
        },
      },
      include: { exams: true },
    });
  }

  update(id: string, data: Prisma.TagUpdateInput, examIds?: string[]) {
    return this.db.$transaction(async (tx) => {
      if (examIds) {
        await tx.tagExam.deleteMany({ where: { tagId: id } });
        if (examIds.length > 0) {
          await tx.tagExam.createMany({
            data: examIds.map((examId) => ({ tagId: id, examId })),
          });
        }
      }

      return tx.tag.update({
        where: { id },
        data,
        include: { exams: true },
      });
    });
  }
}
