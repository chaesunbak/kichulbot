import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import type { Prisma } from '../../infrastructure/database/prisma-client';
import { QuestionSetKind } from '../../infrastructure/database/prisma-client';

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

  findBookmarkListDetail(userId: string, bookmarkListId: string) {
    return this.db.questionSet.findFirst({
      where: this.ownedBookmarkListWhere(userId, bookmarkListId),
      select: this.bookmarkListSelect(),
    });
  }

  findBookmarkListReference(userId: string, bookmarkListId: string) {
    return this.db.questionSet.findFirst({
      where: this.ownedBookmarkListWhere(userId, bookmarkListId),
      select: { id: true },
    });
  }

  findBookmarkListWithItemCount(userId: string, bookmarkListId: string) {
    return this.db.questionSet.findFirst({
      where: this.ownedBookmarkListWhere(userId, bookmarkListId),
      select: { id: true, _count: { select: { items: true } } },
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

  updateBookmarkList(bookmarkListId: string, name: string) {
    return this.db.questionSet.update({
      where: { id: bookmarkListId },
      data: { title: name },
      include: { _count: { select: { items: true } } },
    });
  }

  deleteBookmarkList(bookmarkListId: string) {
    return this.db.questionSet.delete({
      where: { id: bookmarkListId },
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
          select: this.questionSetItemSelect(),
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
        select: this.questionSetItemSelect(),
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

  private ownedBookmarkListWhere(userId: string, bookmarkListId: string) {
    return {
      id: bookmarkListId,
      ownerUserId: userId,
      kind: QuestionSetKind.CUSTOM,
    } satisfies Prisma.QuestionSetWhereInput;
  }

  private bookmarkListSelect() {
    return {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: this.questionSetItemSelect(),
        orderBy: { position: 'asc' as const },
      },
    } satisfies Prisma.QuestionSetSelect;
  }

  private questionSetItemSelect() {
    return {
      createdAt: true,
      position: true,
      questionRevision: {
        select: {
          imageUrl: true,
          imageHash: true,
          question: {
            select: {
              id: true,
              number: true,
              paper: {
                select: {
                  id: true,
                  title: true,
                  examSession: {
                    select: {
                      displayYear: true,
                      exam: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.QuestionSetItemSelect;
  }
}
