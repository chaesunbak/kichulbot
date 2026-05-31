import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Injectable()
export class LibraryRepository {
  constructor(private readonly db: DatabaseService) {}

  findPaper(paperId: string) {
    return this.db.paper.findFirst({
      where: { id: paperId, isPublished: true },
    });
  }

  findBookshelf(userId: string, bookshelfId: string) {
    return this.db.bookshelf.findFirst({
      where: { id: bookshelfId, userId },
      include: this.bookshelfIncludes(),
    });
  }

  findBookshelves(userId: string) {
    return this.db.bookshelf.findMany({
      where: { userId },
      include: this.bookshelfIncludes(),
      orderBy: { createdAt: 'asc' },
    });
  }

  createBookshelf(userId: string, name: string) {
    return this.db.bookshelf.create({
      data: { userId, name },
      include: this.bookshelfIncludes(),
    });
  }

  updateBookshelf(bookshelfId: string, name: string) {
    return this.db.bookshelf.update({
      where: { id: bookshelfId },
      data: { name },
      include: this.bookshelfIncludes(),
    });
  }

  deleteBookshelf(bookshelfId: string) {
    return this.db.bookshelf.delete({ where: { id: bookshelfId } });
  }

  addPaper(bookshelfId: string, paperId: string) {
    return this.db.userPaper.upsert({
      where: { bookshelfId_paperId: { bookshelfId, paperId } },
      create: { bookshelfId, paperId },
      update: {},
      include: {
        paper: { include: { exam: true, subject: true } },
      },
    });
  }

  findLibraryPaper(bookshelfId: string, paperId: string) {
    return this.db.userPaper.findUnique({
      where: { bookshelfId_paperId: { bookshelfId, paperId } },
    });
  }

  deletePaper(bookshelfId: string, paperId: string) {
    return this.db.userPaper.delete({
      where: { bookshelfId_paperId: { bookshelfId, paperId } },
    });
  }

  private bookshelfIncludes() {
    return {
      papers: {
        include: {
          paper: { include: { exam: true, subject: true } },
        },
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }
}
