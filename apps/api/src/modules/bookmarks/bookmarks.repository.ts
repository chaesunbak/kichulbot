import { Injectable } from '@nestjs/common';
import { QuestionSetKind } from '../../infrastructure/database/prisma-client';

import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class BookmarksRepository {
  constructor(private readonly db: DatabaseService) {}

  findBookmarkLists(userId: string) {
    return this.db.questionSet.findMany({
      where: { ownerUserId: userId, kind: QuestionSetKind.CUSTOM },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  findBookmarkList(userId: string, bookmarkListId: string) {
    return this.db.questionSet.findFirst({
      where: {
        id: bookmarkListId,
        ownerUserId: userId,
        kind: QuestionSetKind.CUSTOM,
      },
      include: this.bookmarkListIncludes(),
    });
  }

  createBookmarkList(userId: string, name: string) {
    return this.db.questionSet.create({
      data: {
        ownerUserId: userId,
        kind: QuestionSetKind.CUSTOM,
        title: name,
      },
      include: { _count: { select: { items: true } } },
    });
  }

  findQuestion(questionId: string) {
    return this.db.question.findFirst({
      where: { id: questionId, paper: { isPublished: true } },
    });
  }

  addQuestion(bookmarkListId: string, questionId: string) {
    return this.db.$transaction(async (tx) => {
      const revision = await tx.questionRevision.findFirstOrThrow({
        where: { questionId },
        orderBy: { revision: 'desc' },
      });
      const existing = await tx.questionSetItem.findFirst({
        where: {
          questionSetId: bookmarkListId,
          questionRevision: { questionId },
        },
      });
      if (existing) {
        return tx.questionSetItem.update({
          where: {
            questionSetId_questionRevisionId: {
              questionSetId: bookmarkListId,
              questionRevisionId: existing.questionRevisionId,
            },
          },
          data: { questionRevisionId: revision.id },
          include: this.questionSetItemIncludes(),
        });
      }

      const { _max } = await tx.questionSetItem.aggregate({
        where: { questionSetId: bookmarkListId },
        _max: { position: true },
      });
      return tx.questionSetItem.create({
        data: {
          questionSetId: bookmarkListId,
          questionRevisionId: revision.id,
          position: (_max.position ?? 0) + 1,
        },
        include: this.questionSetItemIncludes(),
      });
    });
  }

  findBookmarkedQuestion(bookmarkListId: string, questionId: string) {
    return this.db.questionSetItem.findFirst({
      where: {
        questionSetId: bookmarkListId,
        questionRevision: { questionId },
      },
    });
  }

  deleteQuestion(bookmarkListId: string, questionId: string) {
    return this.db.$transaction(async (tx) => {
      const item = await tx.questionSetItem.findFirstOrThrow({
        where: {
          questionSetId: bookmarkListId,
          questionRevision: { questionId },
        },
      });
      return tx.questionSetItem.delete({
        where: {
          questionSetId_questionRevisionId: {
            questionSetId: bookmarkListId,
            questionRevisionId: item.questionRevisionId,
          },
        },
      });
    });
  }

  private bookmarkListIncludes() {
    return {
      items: {
        include: this.questionSetItemIncludes(),
        orderBy: { position: 'asc' as const },
      },
    };
  }

  private questionSetItemIncludes() {
    return {
      questionRevision: {
        include: {
          question: {
            include: {
              paper: {
                include: {
                  examSession: { include: { exam: true } },
                },
              },
            },
          },
        },
      },
    };
  }
}
