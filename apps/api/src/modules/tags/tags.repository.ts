import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import { Prisma } from '../../infrastructure/database/prisma-client';

const tagInclude = {
  tagGroup: true,
  _count: {
    select: { questions: true },
  },
};

const tagGroupInclude = {
  _count: {
    select: { tags: true },
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
      orderBy: [
        { tagGroup: { sortOrder: 'asc' } },
        { tagGroup: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  findMany() {
    return this.db.tag.findMany({
      include: tagInclude,
      orderBy: [
        { examId: 'asc' },
        { tagGroup: { sortOrder: 'asc' } },
        { tagGroup: { name: 'asc' } },
        { name: 'asc' },
      ],
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

  findManyTagGroups(examId?: string) {
    return this.db.tagGroup.findMany({
      where: {
        ...(examId ? { examId } : {}),
      },
      include: tagGroupInclude,
      orderBy: [{ examId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findTagGroupById(id: string) {
    return this.db.tagGroup.findUnique({
      where: { id },
      include: tagGroupInclude,
    });
  }

  countTagGroupsByIds(tagGroupIds: string[], examId: string) {
    return this.db.tagGroup.count({
      where: {
        id: { in: tagGroupIds },
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

  createTagGroup(data: Prisma.TagGroupUncheckedCreateInput) {
    return this.db.tagGroup.create({
      data,
      include: tagGroupInclude,
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

  updateTagGroup(id: string, data: Prisma.TagGroupUncheckedUpdateInput) {
    return this.db.tagGroup.update({
      where: { id },
      data,
      include: tagGroupInclude,
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

  async deleteTagGroupIfUnused(id: string) {
    return this.db.$transaction(async (tx) => {
      const tagGroup = await tx.tagGroup.findUnique({
        where: { id },
        include: tagGroupInclude,
      });

      if (!tagGroup) {
        return { tagGroup: null, tagCount: 0 };
      }

      const tagCount = tagGroup._count.tags;
      if (tagCount > 0) {
        return { tagGroup, tagCount };
      }

      await tx.tagGroup.delete({ where: { id } });

      return { tagGroup, tagCount };
    });
  }
}
