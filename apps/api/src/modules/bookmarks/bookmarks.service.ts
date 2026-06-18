import {
  AddBookmarkedQuestionResponse,
  BookmarkListResponseEnvelope,
  BookmarkListSummaryResponseEnvelope,
  DeleteBookmarkedQuestionResponse,
  DeleteBookmarkListResponse,
  ListBookmarkListsResponse,
} from '@kichulbot/api-contract/bookmarks';
import { StartSolveSessionResponse } from '@kichulbot/api-contract/solve-sessions';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AnswerMode } from '../../infrastructure/database/prisma-client';
import { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import { BookmarksRepository } from './bookmarks.repository';
import type {
  BookmarkedQuestionItem,
  BookmarkListPayload,
  BookmarkListQuestionRecord,
  BookmarkListRecord,
  BookmarkListSummaryItem,
  BookmarkListSummaryRecord,
} from './bookmarks.types';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksRepository: BookmarksRepository,
    private readonly solveSessionsService: SolveSessionsService,
  ) {}

  async listBookmarkLists(userId: string): Promise<ListBookmarkListsResponse> {
    const bookmarkLists =
      await this.bookmarksRepository.findBookmarkLists(userId);
    return {
      bookmarkLists: bookmarkLists.map((list) =>
        this.toBookmarkListSummaryItem(list),
      ),
    };
  }

  async createBookmarkList(
    userId: string,
    name: string,
  ): Promise<BookmarkListSummaryResponseEnvelope> {
    const bookmarkList = await this.bookmarksRepository.createBookmarkList(
      userId,
      name.trim(),
    );
    return {
      bookmarkList: this.toBookmarkListSummaryItem(bookmarkList),
    };
  }

  async getBookmarkList(
    userId: string,
    bookmarkListId: string,
  ): Promise<BookmarkListResponseEnvelope> {
    const bookmarkList = await this.getOwnedBookmarkList(
      userId,
      bookmarkListId,
    );
    return {
      bookmarkList: this.toBookmarkListPayload(bookmarkList),
    };
  }

  async updateBookmarkList(
    userId: string,
    bookmarkListId: string,
    name: string,
  ): Promise<BookmarkListSummaryResponseEnvelope> {
    const bookmarkList = await this.getOwnedBookmarkList(
      userId,
      bookmarkListId,
    );
    const updated = await this.bookmarksRepository.updateBookmarkList(
      bookmarkList.id,
      name.trim(),
    );
    return {
      bookmarkList: this.toBookmarkListSummaryItem(updated),
    };
  }

  async deleteBookmarkList(
    userId: string,
    bookmarkListId: string,
  ): Promise<DeleteBookmarkListResponse> {
    const bookmarkList = await this.getOwnedBookmarkList(
      userId,
      bookmarkListId,
    );
    await this.bookmarksRepository.deleteBookmarkList(bookmarkList.id);
    return { id: bookmarkList.id };
  }

  async addQuestion(
    userId: string,
    bookmarkListId: string,
    questionId: string,
  ): Promise<AddBookmarkedQuestionResponse> {
    const [question] = await Promise.all([
      this.bookmarksRepository.findQuestion(questionId),
      this.getOwnedBookmarkList(userId, bookmarkListId),
    ]);
    if (!question) {
      throw new NotFoundException('문제를 찾을 수 없습니다.');
    }
    const questionSetItem = await this.bookmarksRepository.addQuestion(
      bookmarkListId,
      questionId,
    );
    return {
      question: this.toBookmarkedQuestionItem(questionSetItem),
    };
  }

  async deleteQuestion(
    userId: string,
    bookmarkListId: string,
    questionId: string,
  ): Promise<DeleteBookmarkedQuestionResponse> {
    const [, questionSetItem] = await Promise.all([
      this.getOwnedBookmarkList(userId, bookmarkListId),
      this.bookmarksRepository.findBookmarkedQuestion(
        bookmarkListId,
        questionId,
      ),
    ]);
    if (!questionSetItem) {
      throw new NotFoundException('북마크한 문제를 찾을 수 없습니다.');
    }
    await this.bookmarksRepository.deleteQuestion(bookmarkListId, questionId);
    return {
      bookmarkListId,
      questionId,
    };
  }

  async startSolveSession(
    userId: string,
    bookmarkListId: string,
    mode: AnswerMode,
  ): Promise<StartSolveSessionResponse> {
    const bookmarkList = await this.getOwnedBookmarkList(
      userId,
      bookmarkListId,
    );
    if (bookmarkList.items.length === 0) {
      throw new BadRequestException('풀 문제가 없습니다.');
    }
    return this.solveSessionsService.startQuestionSet(
      userId,
      bookmarkList.id,
      mode,
    );
  }

  private async getOwnedBookmarkList(userId: string, bookmarkListId: string) {
    const bookmarkList = await this.bookmarksRepository.findBookmarkList(
      userId,
      bookmarkListId,
    );
    if (!bookmarkList) {
      throw new NotFoundException('북마크 리스트를 찾을 수 없습니다.');
    }
    return bookmarkList;
  }

  private toBookmarkListSummaryItem(
    bookmarkList: BookmarkListSummaryRecord,
  ): BookmarkListSummaryItem {
    return {
      id: bookmarkList.id,
      name: bookmarkList.title,
      questionCount: bookmarkList._count.items,
      createdAt: bookmarkList.createdAt.toISOString(),
      updatedAt: bookmarkList.updatedAt.toISOString(),
    };
  }

  private toBookmarkListPayload(
    bookmarkList: BookmarkListRecord,
  ): BookmarkListPayload {
    return {
      id: bookmarkList.id,
      name: bookmarkList.title,
      questionCount: bookmarkList.items.length,
      questions: bookmarkList.items.map((question) =>
        this.toBookmarkedQuestionItem(question),
      ),
      createdAt: bookmarkList.createdAt.toISOString(),
      updatedAt: bookmarkList.updatedAt.toISOString(),
    };
  }

  private toBookmarkedQuestionItem(
    questionSetItem: BookmarkListQuestionRecord,
  ): BookmarkedQuestionItem {
    const { question } = questionSetItem.questionRevision;
    return {
      id: question.id,
      number: question.number,
      imageUrl: questionSetItem.questionRevision.imageUrl,
      imageCacheKey: this.toImageCacheKey(
        questionSetItem.questionRevision.imageHash,
      ),
      paper: {
        id: question.paper.id,
        title: question.paper.title,
        year: question.paper.examSession.displayYear,
        examName: question.paper.examSession.exam.name,
      },
      createdAt: questionSetItem.createdAt.toISOString(),
    };
  }

  private toImageCacheKey(imageHash: string): string {
    return imageHash.startsWith('legacy_') ? imageHash : `sha256_${imageHash}`;
  }
}
