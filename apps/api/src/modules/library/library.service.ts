import {
  AddLibraryPaperResponse,
  AddLibraryPaperResponseSchema,
  BookshelfResponse,
  BookshelfResponseEnvelope,
  BookshelfResponseEnvelopeSchema,
  DeleteBookshelfResponse,
  DeleteBookshelfResponseSchema,
  DeleteLibraryPaperResponse,
  DeleteLibraryPaperResponseSchema,
  LibraryPaperResponse,
  ListBookshelvesResponse,
  ListBookshelvesResponseSchema,
} from '@kichulbot/api-contract/library';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Bookshelf, Exam, ExamSession, Paper, Subject } from '@prisma/client';
import { LibraryRepository } from './library.repository';

type LibraryPaperWithPaper = {
  createdAt: Date;
  paper: Paper & {
    examSession: ExamSession & { exam: Exam };
    subject: Subject;
  };
};

type BookshelfWithPapers = Bookshelf & {
  papers: LibraryPaperWithPaper[];
};

@Injectable()
export class LibraryService {
  constructor(private readonly libraryRepository: LibraryRepository) {}

  async listBookshelves(userId: string): Promise<ListBookshelvesResponse> {
    const bookshelves = await this.libraryRepository.findBookshelves(userId);
    return ListBookshelvesResponseSchema.parse({
      bookshelves: bookshelves.map((bookshelf) =>
        this.toBookshelfResponse(bookshelf),
      ),
    });
  }

  async createBookshelf(
    userId: string,
    name: string,
  ): Promise<BookshelfResponseEnvelope> {
    const bookshelf = await this.libraryRepository.createBookshelf(
      userId,
      name.trim(),
    );
    return BookshelfResponseEnvelopeSchema.parse({
      bookshelf: this.toBookshelfResponse(bookshelf),
    });
  }

  async updateBookshelf(
    userId: string,
    bookshelfId: string,
    name: string,
  ): Promise<BookshelfResponseEnvelope> {
    await this.getBookshelf(userId, bookshelfId);
    const bookshelf = await this.libraryRepository.updateBookshelf(
      bookshelfId,
      name.trim(),
    );
    return BookshelfResponseEnvelopeSchema.parse({
      bookshelf: this.toBookshelfResponse(bookshelf),
    });
  }

  async deleteBookshelf(
    userId: string,
    bookshelfId: string,
  ): Promise<DeleteBookshelfResponse> {
    await this.getBookshelf(userId, bookshelfId);
    await this.libraryRepository.deleteBookshelf(bookshelfId);
    return DeleteBookshelfResponseSchema.parse({ id: bookshelfId });
  }

  async addPaper(
    userId: string,
    bookshelfId: string,
    paperId: string,
  ): Promise<AddLibraryPaperResponse> {
    const [paper] = await Promise.all([
      this.libraryRepository.findPaper(paperId),
      this.getBookshelf(userId, bookshelfId),
    ]);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const libraryPaper = await this.libraryRepository.addPaper(
      bookshelfId,
      paperId,
    );
    return AddLibraryPaperResponseSchema.parse({
      libraryPaper: this.toLibraryPaperResponse(libraryPaper),
    });
  }

  async deletePaper(
    userId: string,
    bookshelfId: string,
    paperId: string,
  ): Promise<DeleteLibraryPaperResponse> {
    const [, libraryPaper] = await Promise.all([
      this.getBookshelf(userId, bookshelfId),
      this.libraryRepository.findLibraryPaper(bookshelfId, paperId),
    ]);
    if (!libraryPaper) {
      throw new NotFoundException('책장에 추가된 문제지를 찾을 수 없습니다.');
    }

    await this.libraryRepository.deletePaper(bookshelfId, paperId);
    return DeleteLibraryPaperResponseSchema.parse({ bookshelfId, paperId });
  }

  private async getBookshelf(userId: string, bookshelfId: string) {
    const bookshelf = await this.libraryRepository.findBookshelf(
      userId,
      bookshelfId,
    );
    if (!bookshelf) {
      throw new NotFoundException('책장을 찾을 수 없습니다.');
    }
    return bookshelf;
  }

  private toBookshelfResponse(
    bookshelf: BookshelfWithPapers,
  ): BookshelfResponse {
    return {
      id: bookshelf.id,
      name: bookshelf.name,
      papers: bookshelf.papers.map((paper) =>
        this.toLibraryPaperResponse(paper),
      ),
      createdAt: bookshelf.createdAt.toISOString(),
      updatedAt: bookshelf.updatedAt.toISOString(),
    };
  }

  private toLibraryPaperResponse(
    libraryPaper: LibraryPaperWithPaper,
  ): LibraryPaperResponse {
    const { paper } = libraryPaper;
    return {
      paper: {
        id: paper.id,
        title: paper.title,
        year: paper.examSession.displayYear,
        month: paper.examSession.month,
        grade: paper.examSession.grade,
        round: paper.examSession.round,
        questionCount: paper.questionCount,
        isInLibrary: true,
        exam: {
          id: paper.examSession.exam.id,
          name: paper.examSession.exam.name,
          slug: paper.examSession.exam.slug,
        },
        subject: {
          id: paper.subject.id,
          name: paper.subject.name,
          slug: paper.subject.slug,
        },
      },
      createdAt: libraryPaper.createdAt.toISOString(),
    };
  }
}
