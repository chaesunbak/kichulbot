import {
  CreateLibraryFolderRequest,
  DeleteLibraryFolderResponse,
  DeleteLibraryPaperResponse,
  LibraryFolderResponseEnvelope,
  LibraryPaperResponseEnvelope,
  LibraryResponse,
  UpdateLibraryFolderRequest,
} from '@kichulbot/api-contract/library';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { LibraryFolder } from '../../infrastructure/database/prisma-client';
import { LibraryRepository } from './library.repository';
import type {
  LibraryFolderItem,
  LibraryPaperItem,
  LibraryPaperRecord,
} from './library.types';

@Injectable()
export class LibraryService {
  constructor(private readonly libraryRepository: LibraryRepository) {}

  async getLibrary(userId: string): Promise<LibraryResponse> {
    const [folders, papers] = await this.libraryRepository.findLibrary(userId);
    return {
      folders: folders.map((folder) => this.toFolderItem(folder)),
      papers: papers.map((paper) => this.toLibraryPaperItem(paper)),
    };
  }

  async createFolder(
    userId: string,
    dto: CreateLibraryFolderRequest,
  ): Promise<LibraryFolderResponseEnvelope> {
    const name = dto.name.trim();
    const parentId = dto.parentId ?? null;
    await this.assertParentFolder(userId, parentId);
    await this.assertUniqueSiblingName(userId, parentId, name);

    const folder = await this.libraryRepository.createFolder(
      userId,
      name,
      parentId,
    );
    return {
      folder: this.toFolderItem(folder),
    };
  }

  async updateFolder(
    userId: string,
    folderId: string,
    dto: UpdateLibraryFolderRequest,
  ): Promise<LibraryFolderResponseEnvelope> {
    const folder = await this.getFolder(userId, folderId);
    const parentId = Object.prototype.hasOwnProperty.call(dto, 'parentId')
      ? (dto.parentId ?? null)
      : folder.parentId;
    const name = dto.name?.trim() ?? folder.name;

    await this.assertParentFolder(userId, parentId);
    await this.assertNotDescendantParent(userId, folderId, parentId);
    if (name !== folder.name || parentId !== folder.parentId) {
      await this.assertUniqueSiblingName(userId, parentId, name, folderId);
    }

    const updated = await this.libraryRepository.updateFolder(folderId, {
      name,
      parentId,
    });
    return {
      folder: this.toFolderItem(updated),
    };
  }

  async deleteFolder(
    userId: string,
    folderId: string,
  ): Promise<DeleteLibraryFolderResponse> {
    await this.getFolder(userId, folderId);
    const [childCount, paperCount] = await Promise.all([
      this.libraryRepository.countFolderChildren(folderId),
      this.libraryRepository.countFolderPapers(folderId),
    ]);
    if (childCount > 0 || paperCount > 0) {
      throw new ConflictException('비어 있는 폴더만 삭제할 수 있습니다.');
    }

    await this.libraryRepository.deleteFolder(folderId);
    return { id: folderId };
  }

  async addPaper(
    userId: string,
    paperId: string,
    folderId: string | null,
  ): Promise<LibraryPaperResponseEnvelope> {
    const [paper] = await Promise.all([
      this.libraryRepository.findPaper(paperId),
      this.assertParentFolder(userId, folderId),
    ]);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const existing = await this.libraryRepository.findExistingLibraryPaper(
      userId,
      paperId,
      folderId,
    );
    const libraryPaper =
      existing ??
      (await this.libraryRepository.createLibraryPaper(
        userId,
        paperId,
        folderId,
      ));

    return {
      libraryPaper: this.toLibraryPaperItem(libraryPaper),
    };
  }

  async movePaper(
    userId: string,
    libraryPaperId: string,
    folderId: string | null,
  ): Promise<LibraryPaperResponseEnvelope> {
    const libraryPaper = await this.getLibraryPaper(userId, libraryPaperId);
    await this.assertParentFolder(userId, folderId);

    const existing = await this.libraryRepository.findExistingLibraryPaper(
      userId,
      libraryPaper.paper.id,
      folderId,
    );
    if (existing && existing.id !== libraryPaperId) {
      throw new ConflictException('이미 같은 폴더에 저장된 문제지입니다.');
    }

    const updated = await this.libraryRepository.moveLibraryPaper(
      libraryPaperId,
      folderId,
    );
    return {
      libraryPaper: this.toLibraryPaperItem(updated),
    };
  }

  async deletePaper(
    userId: string,
    libraryPaperId: string,
  ): Promise<DeleteLibraryPaperResponse> {
    await this.getLibraryPaper(userId, libraryPaperId);
    await this.libraryRepository.deletePaper(libraryPaperId);
    return { id: libraryPaperId };
  }

  private async getFolder(userId: string, folderId: string) {
    const folder = await this.libraryRepository.findFolder(userId, folderId);
    if (!folder) {
      throw new NotFoundException('폴더를 찾을 수 없습니다.');
    }
    return folder;
  }

  private async getLibraryPaper(userId: string, libraryPaperId: string) {
    const libraryPaper = await this.libraryRepository.findLibraryPaper(
      userId,
      libraryPaperId,
    );
    if (!libraryPaper) {
      throw new NotFoundException(
        '내 서재에 저장된 문제지를 찾을 수 없습니다.',
      );
    }
    return libraryPaper;
  }

  private async assertParentFolder(userId: string, parentId: string | null) {
    if (!parentId) return;
    await this.getFolder(userId, parentId);
  }

  private async assertUniqueSiblingName(
    userId: string,
    parentId: string | null,
    name: string,
    ignoreFolderId?: string,
  ) {
    const sibling = await this.libraryRepository.findSiblingFolder(
      userId,
      parentId,
      name,
    );
    if (sibling && sibling.id !== ignoreFolderId) {
      throw new ConflictException('같은 위치에 같은 이름의 폴더가 있습니다.');
    }
  }

  private async assertNotDescendantParent(
    userId: string,
    folderId: string,
    parentId: string | null,
  ) {
    if (!parentId) return;
    if (parentId === folderId) {
      throw new BadRequestException(
        '자기 자신을 상위 폴더로 지정할 수 없습니다.',
      );
    }

    const folders = await this.libraryRepository.findFolders(userId);
    let current = folders.find((folder) => folder.id === parentId);
    while (current) {
      if (current.parentId === folderId) {
        throw new BadRequestException(
          '하위 폴더를 상위 폴더로 지정할 수 없습니다.',
        );
      }
      current = folders.find((folder) => folder.id === current?.parentId);
    }
  }

  private toFolderItem(folder: LibraryFolder): LibraryFolderItem {
    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      sortOrder: folder.sortOrder,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  private toLibraryPaperItem(
    libraryPaper: LibraryPaperRecord,
  ): LibraryPaperItem {
    const { paper } = libraryPaper;
    return {
      id: libraryPaper.id,
      folderId: libraryPaper.folderId,
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
        },
      },
      createdAt: libraryPaper.createdAt.toISOString(),
      updatedAt: libraryPaper.updatedAt.toISOString(),
    };
  }
}
