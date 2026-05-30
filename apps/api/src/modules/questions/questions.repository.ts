import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class QuestionsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.QuestionUncheckedCreateInput, tagIds: string[]) {
    return this.db.question.create({
      data: {
        ...data,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
      include: this.questionIncludes(),
    });
  }

  findById(id: string) {
    return this.db.question.findUnique({
      where: { id },
      include: this.questionIncludes(),
    });
  }

  findPaper(paperId: string) {
    return this.db.paper.findUnique({ where: { id: paperId } });
  }

  countTagsByIds(tagIds: string[]) {
    return this.db.tag.count({ where: { id: { in: tagIds } } });
  }

  updateImageUrl(id: string, imageUrl: string) {
    return this.db.question.update({
      where: { id },
      data: { imageUrl },
      include: this.questionIncludes(),
    });
  }

  delete(id: string) {
    return this.db.question.delete({ where: { id } });
  }

  update(
    id: string,
    data: Prisma.QuestionUncheckedUpdateInput,
    tagIds?: string[],
  ) {
    return this.db.$transaction(async (tx) => {
      if (tagIds) {
        await tx.questionTag.deleteMany({ where: { questionId: id } });
        if (tagIds.length > 0) {
          await tx.questionTag.createMany({
            data: tagIds.map((tagId) => ({ questionId: id, tagId })),
          });
        }
      }

      return tx.question.update({
        where: { id },
        data,
        include: this.questionIncludes(),
      });
    });
  }

  private questionIncludes() {
    return {
      tags: { include: { tag: true } },
    } satisfies Prisma.QuestionInclude;
  }
}
