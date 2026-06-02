import {
  AddBookmarkedQuestionResponse,
  AddBookmarkedQuestionResponseSchema,
  BookmarkedQuestionResponse,
  BookmarkListResponse,
  BookmarkListResponseEnvelope,
  BookmarkListResponseEnvelopeSchema,
  BookmarkListSummaryResponse,
  BookmarkListSummaryResponseEnvelope,
  BookmarkListSummaryResponseEnvelopeSchema,
  DeleteBookmarkedQuestionResponse,
  DeleteBookmarkedQuestionResponseSchema,
  ListBookmarkListsResponse,
  ListBookmarkListsResponseSchema,
} from '@kichulbot/api-contract/bookmarks';
import { StartSolveSessionResponse } from '@kichulbot/api-contract/solve-sessions';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnswerMode, Prisma } from '@prisma/client';

import { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import { BookmarksRepository } from './bookmarks.repository';

type BookmarkListSummary = Prisma.QuestionSetGetPayload<{
  include: { _count: { select: { items: true } } };
}>;
type BookmarkListWithQuestions = Prisma.QuestionSetGetPayload<{
  include: {
    items: {
      include: {
        questionRevision: {
          include: {
            question: {
              include: {
                paper: {
                  include: {
                    examSession: { include: { exam: true } };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;
type BookmarkListItemWithQuestion = BookmarkListWithQuestions['items'][number];

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksRepository: BookmarksRepository,
    private readonly solveSessionsService: SolveSessionsService,
  ) {}

  async listBookmarkLists(userId: string): Promise<ListBookmarkListsResponse> {
    const bookmarkLists =
      await this.bookmarksRepository.findBookmarkLists(userId);
    return ListBookmarkListsResponseSchema.parse({
      bookmarkLists: bookmarkLists.map((list) => this.toSummaryResponse(list)),
    });
  }

  async createBookmarkList(
    userId: string,
    name: string,
  ): Promise<BookmarkListSummaryResponseEnvelope> {
    const bookmarkList = await this.bookmarksRepository.createBookmarkList(
      userId,
      name.trim(),
    );
    return BookmarkListSummaryResponseEnvelopeSchema.parse({
      bookmarkList: this.toSummaryResponse(bookmarkList),
    });
  }

  async getBookmarkList(
    userId: string,
    bookmarkListId: string,
  ): Promise<BookmarkListResponseEnvelope> {
    const bookmarkList = await this.getOwnedBookmarkList(
      userId,
      bookmarkListId,
    );
    return BookmarkListResponseEnvelopeSchema.parse({
      bookmarkList: this.toBookmarkListResponse(bookmarkList),
    });
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
    return AddBookmarkedQuestionResponseSchema.parse({
      question: this.toQuestionResponse(questionSetItem),
    });
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
    return DeleteBookmarkedQuestionResponseSchema.parse({
      bookmarkListId,
      questionId,
    });
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

  private toSummaryResponse(
    bookmarkList: BookmarkListSummary,
  ): BookmarkListSummaryResponse {
    return {
      id: bookmarkList.id,
      name: bookmarkList.title,
      questionCount: bookmarkList._count.items,
      createdAt: bookmarkList.createdAt.toISOString(),
      updatedAt: bookmarkList.updatedAt.toISOString(),
    };
  }

  private toBookmarkListResponse(
    bookmarkList: BookmarkListWithQuestions,
  ): BookmarkListResponse {
    return {
      id: bookmarkList.id,
      name: bookmarkList.title,
      questionCount: bookmarkList.items.length,
      questions: bookmarkList.items.map((question) =>
        this.toQuestionResponse(question),
      ),
      createdAt: bookmarkList.createdAt.toISOString(),
      updatedAt: bookmarkList.updatedAt.toISOString(),
    };
  }

  private toQuestionResponse(
    questionSetItem: BookmarkListItemWithQuestion,
  ): BookmarkedQuestionResponse {
    const { question } = questionSetItem.questionRevision;
    return {
      id: question.id,
      number: question.number,
      imageUrl: question.imageUrl,
      paper: {
        id: question.paper.id,
        title: question.paper.title,
        year: question.paper.examSession.displayYear,
        examName: question.paper.examSession.exam.name,
      },
      createdAt: questionSetItem.createdAt.toISOString(),
    };
  }
}
