import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  findManyAvailable(subjectId?: string) {
    return this.db.tag.findMany({
      where: {
        isActive: true,
        ...(subjectId ? { subjects: { some: { subjectId } } } : {}),
      },
      include: { subjects: true },
      orderBy: { name: 'asc' },
    });
  }

  findMany() {
    return this.db.tag.findMany({
      include: { subjects: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.tag.findUnique({
      where: { id },
      include: { subjects: true },
    });
  }

  countAssignableByIds(tagIds: string[], subjectId: string) {
    return this.db.tag.count({
      where: {
        id: { in: tagIds },
        isActive: true,
        subjects: { some: { subjectId } },
      },
    });
  }

  countSubjectsByIds(subjectIds: string[]) {
    return this.db.subject.count({ where: { id: { in: subjectIds } } });
  }

  create(data: Prisma.TagCreateInput, subjectIds: string[]) {
    return this.db.tag.create({
      data: {
        ...data,
        subjects: {
          create: subjectIds.map((subjectId) => ({ subjectId })),
        },
      },
      include: { subjects: true },
    });
  }

  update(id: string, data: Prisma.TagUpdateInput, subjectIds?: string[]) {
    return this.db.$transaction(async (tx) => {
      if (subjectIds) {
        await tx.tagSubject.deleteMany({ where: { tagId: id } });
        if (subjectIds.length > 0) {
          await tx.tagSubject.createMany({
            data: subjectIds.map((subjectId) => ({ tagId: id, subjectId })),
          });
        }
      }

      return tx.tag.update({
        where: { id },
        data,
        include: { subjects: true },
      });
    });
  }
}
