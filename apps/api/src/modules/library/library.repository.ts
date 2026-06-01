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

  findLibrary(userId: string) {
    return Promise.all([
      this.findFolders(userId),
      this.findLibraryPapers(userId),
    ]);
  }

  findFolders(userId: string) {
    return this.db.libraryFolder.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findFolder(userId: string, folderId: string) {
    return this.db.libraryFolder.findFirst({
      where: { id: folderId, userId },
    });
  }

  findSiblingFolder(userId: string, parentId: string | null, name: string) {
    return this.db.libraryFolder.findFirst({
      where: { userId, parentId, name },
    });
  }

  createFolder(userId: string, name: string, parentId: string | null) {
    return this.db.libraryFolder.create({
      data: { userId, name, parentId },
    });
  }

  updateFolder(
    folderId: string,
    data: { name?: string; parentId?: string | null },
  ) {
    return this.db.libraryFolder.update({
      where: { id: folderId },
      data,
    });
  }

  countFolderChildren(folderId: string) {
    return this.db.libraryFolder.count({ where: { parentId: folderId } });
  }

  countFolderPapers(folderId: string) {
    return this.db.userPaper.count({ where: { folderId } });
  }

  deleteFolder(folderId: string) {
    return this.db.libraryFolder.delete({ where: { id: folderId } });
  }

  findLibraryPapers(userId: string) {
    return this.db.userPaper.findMany({
      where: { userId },
      include: this.libraryPaperIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  findLibraryPaper(userId: string, libraryPaperId: string) {
    return this.db.userPaper.findFirst({
      where: { id: libraryPaperId, userId },
      include: this.libraryPaperIncludes(),
    });
  }

  findExistingLibraryPaper(
    userId: string,
    paperId: string,
    folderId: string | null,
  ) {
    return this.db.userPaper.findFirst({
      where: { userId, paperId, folderId },
      include: this.libraryPaperIncludes(),
    });
  }

  createLibraryPaper(userId: string, paperId: string, folderId: string | null) {
    return this.db.userPaper.create({
      data: { userId, paperId, folderId },
      include: this.libraryPaperIncludes(),
    });
  }

  moveLibraryPaper(libraryPaperId: string, folderId: string | null) {
    return this.db.userPaper.update({
      where: { id: libraryPaperId },
      data: { folderId },
      include: this.libraryPaperIncludes(),
    });
  }

  deletePaper(libraryPaperId: string) {
    return this.db.userPaper.delete({
      where: { id: libraryPaperId },
    });
  }

  private libraryPaperIncludes() {
    return {
      paper: {
        include: {
          examSession: { include: { exam: true } },
        },
      },
    };
  }
}
