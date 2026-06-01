import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Question,
  QuestionRevision,
  QuestionSetKind,
} from '@prisma/client';

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
    return this.db.paper.findUnique({
      where: { id: paperId },
      include: { examSession: true },
    });
  }

  updateImageUrl(id: string, imageUrl: string) {
    return this.db.$transaction(async (tx) => {
      const question = await tx.question.update({
        where: { id },
        data: { imageUrl },
        include: { paper: true },
      });
      const revision = await tx.questionRevision.create({
        data: this.toRevisionData(question, 1),
      });
      await tx.questionSetItem.create({
        data: {
          questionSetId: question.paper.questionSetId,
          questionRevisionId: revision.id,
          position: question.number,
        },
      });

      return tx.question.findUniqueOrThrow({
        where: { id },
        include: this.questionIncludes(),
      });
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

      return tx.question
        .update({
          where: { id },
          data,
          include: { paper: true },
        })
        .then(async (question) => {
          const latestRevision = await tx.questionRevision.findFirst({
            where: { questionId: id },
            orderBy: { revision: 'desc' },
          });
          const revision = await this.createRevisionIfChanged(
            tx,
            question,
            latestRevision,
          );

          if (revision && latestRevision) {
            await tx.questionSetItem.updateMany({
              where: {
                questionRevisionId: latestRevision.id,
                questionSet: { kind: QuestionSetKind.OFFICIAL_PAPER },
              },
              data: { questionRevisionId: revision.id },
            });
          }
          if (!revision && latestRevision) {
            await this.updateLatestRevisionMetadata(
              tx,
              latestRevision.id,
              question,
            );
          }
          await tx.questionSetItem.updateMany({
            where: {
              questionRevision: { questionId: id },
              questionSet: { kind: QuestionSetKind.OFFICIAL_PAPER },
            },
            data: { position: question.number },
          });

          return tx.question.findUniqueOrThrow({
            where: { id },
            include: this.questionIncludes(),
          });
        });
    });
  }

  private async createRevisionIfChanged(
    tx: Prisma.TransactionClient,
    question: Question & { paper: { questionSetId: string } },
    latestRevision: QuestionRevision | null,
  ) {
    if (latestRevision && !this.hasRevisionChanges(question, latestRevision)) {
      return null;
    }

    const revision = await tx.questionRevision.create({
      data: this.toRevisionData(question, (latestRevision?.revision ?? 0) + 1),
    });
    if (!latestRevision) {
      await tx.questionSetItem.create({
        data: {
          questionSetId: question.paper.questionSetId,
          questionRevisionId: revision.id,
          position: question.number,
        },
      });
    }
    return revision;
  }

  private hasRevisionChanges(question: Question, revision: QuestionRevision) {
    return (
      question.type !== revision.type ||
      question.imageUrl !== revision.imageUrl ||
      question.choiceCount !== revision.choiceCount ||
      question.answerChoice !== revision.answerChoice ||
      question.answerText !== revision.answerText ||
      question.points !== revision.points
    );
  }

  private updateLatestRevisionMetadata(
    tx: Prisma.TransactionClient,
    id: string,
    question: Question,
  ) {
    return tx.questionRevision.update({
      where: { id },
      data: {
        explanation: question.explanation,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
      },
    });
  }

  private toRevisionData(question: Question, revision: number) {
    return {
      questionId: question.id,
      revision,
      type: question.type,
      imageUrl: question.imageUrl,
      choiceCount: question.choiceCount,
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      points: question.points,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
    };
  }

  private questionIncludes() {
    return {
      tags: { include: { tag: true } },
    } satisfies Prisma.QuestionInclude;
  }
}
