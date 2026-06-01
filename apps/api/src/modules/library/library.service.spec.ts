import { ConflictException } from '@nestjs/common';
import { Exam, ExamSession, LibraryFolder, Paper } from '@prisma/client';

import { LibraryRepository } from './library.repository';
import { LibraryService } from './library.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const exam = {
  id: 'exam_1',
  name: '수능',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  createdAt: now,
  updatedAt: now,
} satisfies Exam;
const examSession = {
  id: 'exam_session_1',
  key: 'exam_1:2025:-:-:-',
  examId: exam.id,
  displayYear: 2025,
  month: null,
  grade: null,
  round: null,
  createdAt: now,
  updatedAt: now,
  exam,
} satisfies ExamSession & { exam: Exam };
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  questionCount: 20,
  isPublished: true,
  examSessionId: examSession.id,
  questionSetId: 'question_set_1',
  createdAt: now,
  updatedAt: now,
  examSession,
} satisfies Paper & {
  examSession: ExamSession & { exam: Exam };
};
const folder = {
  id: 'folder_1',
  userId: 'user_1',
  parentId: null,
  name: '한국사',
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,
} satisfies LibraryFolder;
const libraryPaper = {
  id: 'library_paper_1',
  userId: 'user_1',
  paperId: paper.id,
  folderId: folder.id,
  createdAt: now,
  updatedAt: now,
  paper,
};

describe('LibraryService', () => {
  let service: LibraryService;
  let repository: jest.Mocked<LibraryRepository>;

  beforeEach(() => {
    repository = {
      findPaper: jest.fn(),
      findLibrary: jest.fn(),
      findFolders: jest.fn(),
      findFolder: jest.fn(),
      findSiblingFolder: jest.fn(),
      createFolder: jest.fn(),
      updateFolder: jest.fn(),
      countFolderChildren: jest.fn(),
      countFolderPapers: jest.fn(),
      deleteFolder: jest.fn(),
      findLibraryPapers: jest.fn(),
      findLibraryPaper: jest.fn(),
      findExistingLibraryPaper: jest.fn(),
      createLibraryPaper: jest.fn(),
      moveLibraryPaper: jest.fn(),
      deletePaper: jest.fn(),
    } as unknown as jest.Mocked<LibraryRepository>;
    service = new LibraryService(repository);
  });

  it('queries library data with the current user id', async () => {
    repository.findLibrary.mockResolvedValue([[], []]);

    await service.getLibrary('user_2');

    expect(repository.findLibrary).toHaveBeenCalledWith('user_2');
  });

  it('adds a paper to a selected folder and returns the saved record id', async () => {
    repository.findPaper.mockResolvedValue(paper);
    repository.findFolder.mockResolvedValue(folder);
    repository.findExistingLibraryPaper.mockResolvedValue(null);
    repository.createLibraryPaper.mockResolvedValue(libraryPaper);

    await expect(
      service.addPaper('user_1', paper.id, folder.id),
    ).resolves.toMatchObject({
      libraryPaper: { id: libraryPaper.id, folderId: folder.id },
    });

    expect(repository.createLibraryPaper).toHaveBeenCalledWith(
      'user_1',
      paper.id,
      folder.id,
    );
  });

  it('reuses an existing record for the same paper in the same folder', async () => {
    repository.findPaper.mockResolvedValue(paper);
    repository.findFolder.mockResolvedValue(folder);
    repository.findExistingLibraryPaper.mockResolvedValue(libraryPaper);

    await service.addPaper('user_1', paper.id, folder.id);

    expect(repository.createLibraryPaper).not.toHaveBeenCalled();
  });

  it('blocks deleting non-empty folders', async () => {
    repository.findFolder.mockResolvedValue(folder);
    repository.countFolderChildren.mockResolvedValue(1);
    repository.countFolderPapers.mockResolvedValue(0);

    await expect(
      service.deleteFolder('user_1', folder.id),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.deleteFolder).not.toHaveBeenCalled();
  });

  it('moves a saved paper to another folder', async () => {
    repository.findLibraryPaper.mockResolvedValue(libraryPaper);
    repository.findFolder.mockResolvedValue(folder);
    repository.findExistingLibraryPaper.mockResolvedValue(null);
    repository.moveLibraryPaper.mockResolvedValue({
      ...libraryPaper,
      folderId: 'folder_2',
    });

    await service.movePaper('user_1', libraryPaper.id, 'folder_2');

    expect(repository.moveLibraryPaper).toHaveBeenCalledWith(
      libraryPaper.id,
      'folder_2',
    );
  });
});
