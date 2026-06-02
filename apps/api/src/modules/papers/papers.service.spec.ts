import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  Category,
  Exam,
  ExamCategory,
  ExamSession,
  Paper,
  Question,
  UserPaper,
} from '@prisma/client';
import { UserRole } from '@prisma/client';

import type { StorageService } from '../../infrastructure/storage/storage.service';
import type { ExamsService } from '../exams/exams.service';
import type { QuestionsService } from '../questions/questions.service';
import type { PapersRepository } from './papers.repository';
import { PapersService } from './papers.service';

const now = new Date('2026-05-28T00:00:00.000Z');

const category: Category = {
  id: 'category_1',
  name: '수능',
  createdAt: now,
  updatedAt: now,
};

const exam: Exam = {
  id: 'exam_1',
  name: '수능',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  createdAt: now,
  updatedAt: now,
};
const examWithCategories: Exam & {
  categories: Array<ExamCategory & { category: Category }>;
  sessions: Array<{ _count: { papers: number } }>;
} = {
  ...exam,
  categories: [
    {
      examId: exam.id,
      categoryId: category.id,
      createdAt: now,
      category,
    },
  ],
  sessions: [],
};

const examSession: ExamSession = {
  id: 'exam_session_1',
  key: 'exam_1:2025:-:-:-',
  examId: exam.id,
  displayYear: 2025,
  month: null,
  grade: null,
  round: null,
  createdAt: now,
  updatedAt: now,
};

const paper = (
  overrides: Partial<Paper> = {},
): Paper & {
  examSession: ExamSession & { exam: Exam };
  questions: Question[];
  users: UserPaper[];
} => ({
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  questionCount: 20,
  isPublished: false,
  examSessionId: examSession.id,
  questionSetId: 'question_set_1',
  createdAt: now,
  updatedAt: now,
  examSession: { ...examSession, exam },
  questions: [],
  users: [],
  ...overrides,
});

describe('PapersService', () => {
  let service: PapersService;
  let repository: jest.Mocked<PapersRepository>;
  let examsService: jest.Mocked<ExamsService>;
  let storageService: jest.Mocked<StorageService>;
  let questionsService: jest.Mocked<QuestionsService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<PapersRepository>;
    examsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamsService>;
    storageService = {
      uploadQuestionImage: jest.fn(),
      getPublicUrl: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    questionsService = {
      createQuestion: jest.fn(),
    } as unknown as jest.Mocked<QuestionsService>;

    service = new PapersService(
      repository,
      examsService,
      storageService,
      questionsService,
    );
  });

  it('returns only published papers for normal users without admin fields', async () => {
    repository.findMany.mockResolvedValue([paper({ isPublished: true })]);

    const response = await service.listPapers(UserRole.USER);

    expect(repository.findMany).toHaveBeenCalledWith(
      { isPublished: true },
      undefined,
    );
    expect(response.papers[0]).toMatchObject({
      id: 'paper_1',
      title: '2025학년도 수능 한국사',
      exam: { id: 'exam_1', name: '수능' },
    });
    expect(response.papers[0]).not.toHaveProperty('isPublished');
    expect(response.papers[0]).not.toHaveProperty('createdAt');
  });

  it('returns all papers for admins with admin fields', async () => {
    repository.findMany.mockResolvedValue([paper()]);

    const response = await service.listPapers(UserRole.ADMIN);

    expect(repository.findMany).toHaveBeenCalledWith({}, undefined);
    expect(response.papers[0]).toMatchObject({
      id: 'paper_1',
      isPublished: false,
      registeredQuestionCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('marks papers already added to the current user library', async () => {
    repository.findMany.mockResolvedValue([
      paper({
        users: [
          {
            id: 'library_paper_1',
            userId: 'user_1',
            paperId: 'paper_1',
            folderId: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      } as never),
    ]);

    const response = await service.listPapers(UserRole.USER, 'user_1');

    expect(repository.findMany).toHaveBeenCalledWith(
      { isPublished: true },
      'user_1',
    );
    expect(response.papers[0]).toMatchObject({ isInLibrary: true });
  });

  it('filters papers by exam id when provided', async () => {
    repository.findMany.mockResolvedValue([paper({ isPublished: true })]);

    await service.listPapers(UserRole.USER, undefined, { examId: 'exam_1' });

    expect(repository.findMany).toHaveBeenCalledWith(
      {
        isPublished: true,
        examSession: { examId: 'exam_1' },
      },
      undefined,
    );
  });

  it('rejects creating a paper when the exam id is invalid', async () => {
    examsService.findById.mockResolvedValue(null);

    await expect(
      service.createPaper(
        {
          title: '2025학년도 수능 한국사',
          year: 2025,
          examId: 'missing_exam',
        },
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a paper after checking the exam id', async () => {
    examsService.findById.mockResolvedValue(examWithCategories);
    repository.create.mockResolvedValue(paper({ isPublished: true }));

    const response = await service.createPaper(
      {
        title: '2025학년도 수능 한국사',
        year: 2025,
        examId: exam.id,
        isPublished: true,
      },
      UserRole.ADMIN,
    );

    expect(repository.create).toHaveBeenCalledWith({
      title: '2025학년도 수능 한국사',
      examId: exam.id,
      displayYear: 2025,
      month: null,
      grade: null,
      round: null,
      questionCount: 20,
      isPublished: true,
    });
    expect(response.paper).toMatchObject({ isPublished: true });
  });

  it('requires grade when the selected exam uses grade classification', async () => {
    examsService.findById.mockResolvedValue({
      ...examWithCategories,
      usesGrade: true,
    });

    await expect(
      service.createPaper(
        {
          title: '2026년 3월 고1 학평 한국사',
          year: 2026,
          examId: exam.id,
        },
        UserRole.ADMIN,
      ),
    ).rejects.toThrow('대상 학년을 입력해주세요.');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('hides unpublished paper details from normal users', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.getPaper('paper_1', UserRole.USER),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith('paper_1', {
      isPublished: true,
    });
  });

  it('updates the published state for admins', async () => {
    repository.findById.mockResolvedValue(paper() as never);
    repository.update.mockResolvedValue(paper({ isPublished: true }));

    const response = await service.updatePaper('paper_1', {
      isPublished: true,
    });

    expect(repository.update).toHaveBeenCalledWith('paper_1', {
      isPublished: true,
    });
    expect(response.paper).toMatchObject({ id: 'paper_1', isPublished: true });
  });

  it('deletes a paper and its stored question images', async () => {
    repository.findById.mockResolvedValue({
      ...paper(),
      questions: [
        {
          imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
        } as Question,
      ],
    } as never);

    await service.deletePaper('paper_1');

    expect(repository.delete).toHaveBeenCalledWith('paper_1');
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'questions/question_1.png',
    );
  });
});
