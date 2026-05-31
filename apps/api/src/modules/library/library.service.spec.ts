import { Bookshelf, Exam, Paper, Subject } from '@prisma/client';
import { LibraryRepository } from './library.repository';
import { LibraryService } from './library.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  year: 2025,
  questionCount: 20,
  isPublished: true,
  examId: 'exam_1',
  subjectId: 'subject_1',
  createdAt: now,
  updatedAt: now,
  exam: { id: 'exam_1', name: '수능', slug: 'suneung' } as Exam,
  subject: {
    id: 'subject_1',
    name: '한국사',
    slug: 'korean-history',
  } as Subject,
} satisfies Paper & { exam: Exam; subject: Subject };
const bookshelf = {
  id: 'bookshelf_1',
  userId: 'user_1',
  name: '기본 책장',
  createdAt: now,
  updatedAt: now,
  papers: [],
} satisfies Bookshelf & { papers: [] };

describe('LibraryService', () => {
  let service: LibraryService;
  let repository: jest.Mocked<LibraryRepository>;

  beforeEach(() => {
    repository = {
      findPaper: jest.fn(),
      findBookshelf: jest.fn(),
      findBookshelves: jest.fn(),
      createBookshelf: jest.fn(),
      updateBookshelf: jest.fn(),
      deleteBookshelf: jest.fn(),
      addPaper: jest.fn(),
      findLibraryPaper: jest.fn(),
      deletePaper: jest.fn(),
    } as unknown as jest.Mocked<LibraryRepository>;
    service = new LibraryService(repository);
  });

  it('uses an idempotent repository operation when the same paper is added again', async () => {
    repository.findPaper.mockResolvedValue(paper);
    repository.findBookshelf.mockResolvedValue(bookshelf);
    repository.addPaper.mockResolvedValue({
      bookshelfId: bookshelf.id,
      paperId: paper.id,
      createdAt: now,
      paper,
    });

    await service.addPaper('user_1', bookshelf.id, paper.id);
    await service.addPaper('user_1', bookshelf.id, paper.id);

    expect(repository.addPaper).toHaveBeenNthCalledWith(
      1,
      bookshelf.id,
      paper.id,
    );
    expect(repository.addPaper).toHaveBeenNthCalledWith(
      2,
      bookshelf.id,
      paper.id,
    );
  });

  it('queries bookshelves with the current user id', async () => {
    repository.findBookshelves.mockResolvedValue([]);

    await service.listBookshelves('user_2');

    expect(repository.findBookshelves).toHaveBeenCalledWith('user_2');
  });

  it('removes a paper from the selected bookshelf', async () => {
    repository.findBookshelf.mockResolvedValue(bookshelf);
    repository.findLibraryPaper.mockResolvedValue({
      bookshelfId: bookshelf.id,
      paperId: paper.id,
      createdAt: now,
    });
    repository.deletePaper.mockResolvedValue({
      bookshelfId: bookshelf.id,
      paperId: paper.id,
      createdAt: now,
    });

    await expect(
      service.deletePaper('user_1', bookshelf.id, paper.id),
    ).resolves.toEqual({ bookshelfId: bookshelf.id, paperId: paper.id });

    expect(repository.findBookshelf).toHaveBeenCalledWith(
      'user_1',
      bookshelf.id,
    );
    expect(repository.deletePaper).toHaveBeenCalledWith(bookshelf.id, paper.id);
  });
});
