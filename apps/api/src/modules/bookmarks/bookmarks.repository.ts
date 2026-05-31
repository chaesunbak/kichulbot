import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class BookmarksRepository {
  constructor(private readonly db: DatabaseService) {}

  findBookmarkLists(userId: string) {
    return this.db.bookmarkList.findMany({
      where: { userId },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  findBookmarkList(userId: string, bookmarkListId: string) {
    return this.db.bookmarkList.findFirst({
      where: { id: bookmarkListId, userId },
      include: this.bookmarkListIncludes(),
    });
  }

  createBookmarkList(userId: string, name: string) {
    return this.db.bookmarkList.create({
      data: { userId, name },
      include: { _count: { select: { questions: true } } },
    });
  }

  findQuestion(questionId: string) {
    return this.db.question.findFirst({
      where: { id: questionId, paper: { isPublished: true } },
    });
  }

  addQuestion(bookmarkListId: string, questionId: string) {
    return this.db.bookmarkedQuestion.upsert({
      where: {
        bookmarkListId_questionId: { bookmarkListId, questionId },
      },
      create: { bookmarkListId, questionId },
      update: {},
      include: this.bookmarkedQuestionIncludes(),
    });
  }

  findBookmarkedQuestion(bookmarkListId: string, questionId: string) {
    return this.db.bookmarkedQuestion.findUnique({
      where: {
        bookmarkListId_questionId: { bookmarkListId, questionId },
      },
    });
  }

  deleteQuestion(bookmarkListId: string, questionId: string) {
    return this.db.bookmarkedQuestion.delete({
      where: {
        bookmarkListId_questionId: { bookmarkListId, questionId },
      },
    });
  }

  private bookmarkListIncludes() {
    return {
      questions: {
        include: this.bookmarkedQuestionIncludes(),
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }

  private bookmarkedQuestionIncludes() {
    return {
      question: {
        include: {
          paper: { include: { exam: true, subject: true } },
        },
      },
    };
  }
}
