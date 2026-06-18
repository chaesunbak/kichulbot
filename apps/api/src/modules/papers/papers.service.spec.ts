import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import type {
  Category,
  Exam,
  ExamCategory,
  ExamSession,
  MockExamBlueprintItem,
  Paper,
  Question,
  UserPaper,
} from '../../infrastructure/database/prisma-client';
import { UserRole } from '../../infrastructure/database/prisma-client';
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
  slug: 'korean-history',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  mockExamQuestionCount: null,
  eraTagGroupId: null,
  createdAt: now,
  updatedAt: now,
};
const examWithCategories: Exam & {
  categories: Array<ExamCategory & { category: Category }>;
  mockExamBlueprintItems: MockExamBlueprintItem[];
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
  mockExamBlueprintItems: [],
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

const paperListItem = (
  overrides: Partial<
    ReturnType<typeof paper> & { _count: { questions: number } }
  > = {},
) => ({
  ...paper(),
  _count: { questions: 0 },
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
      countQuestionAttempts: jest.fn().mockResolvedValue(0),
      delete: jest.fn(),
      findMany: jest.fn(),
      findManyForList: jest.fn(),
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

  it('일반 사용자에게는 관리자 필드 없이 공개된 시험지만 반환한다', async () => {
    repository.findManyForList.mockResolvedValue([
      paperListItem({ isPublished: true }),
    ]);

    const response = await service.listPublicPapers();

    expect(repository.findManyForList).toHaveBeenCalledWith(
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

  it('관리자에게는 관리자 필드를 포함한 전체 시험지를 반환한다', async () => {
    repository.findManyForList.mockResolvedValue([paperListItem()]);

    const response = await service.listAdminPapers();

    expect(repository.findManyForList).toHaveBeenCalledWith({}, undefined);
    expect(response.papers[0]).toMatchObject({
      id: 'paper_1',
      isPublished: false,
      registeredQuestionCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('현재 사용자 서재에 이미 담긴 시험지를 표시한다', async () => {
    repository.findManyForList.mockResolvedValue([
      paperListItem({
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
      }),
    ]);

    const response = await service.listPublicPapers('user_1');

    expect(repository.findManyForList).toHaveBeenCalledWith(
      { isPublished: true },
      'user_1',
    );
    expect(response.papers[0]).toMatchObject({ isInLibrary: true });
  });

  it('시험 식별자가 주어지면 해당 시험 기준으로 시험지를 필터링한다', async () => {
    repository.findManyForList.mockResolvedValue([
      paperListItem({ isPublished: true }),
    ]);

    await service.listPublicPapers(undefined, { examId: 'exam_1' });

    expect(repository.findManyForList).toHaveBeenCalledWith(
      {
        isPublished: true,
        examSession: { examId: 'exam_1' },
      },
      undefined,
    );
  });

  it('분류 식별자가 주어지면 해당 분류의 시험지로 필터링한다', async () => {
    repository.findManyForList.mockResolvedValue([
      paperListItem({ isPublished: true }),
    ]);

    await service.listPublicPapers(undefined, {
      categoryId: 'category_1',
    });

    expect(repository.findManyForList).toHaveBeenCalledWith(
      {
        isPublished: true,
        examSession: {
          exam: {
            categories: { some: { categoryId: 'category_1' } },
          },
        },
      },
      undefined,
    );
  });

  it('검색어가 주어지면 시험지 제목과 시험 이름으로 검색한다', async () => {
    repository.findManyForList.mockResolvedValue([
      paperListItem({ isPublished: true }),
    ]);

    await service.listPublicPapers(undefined, { q: '한국사' });

    expect(repository.findManyForList).toHaveBeenCalledWith(
      {
        isPublished: true,
        OR: [
          { title: { contains: '한국사', mode: 'insensitive' } },
          {
            examSession: {
              exam: { name: { contains: '한국사', mode: 'insensitive' } },
            },
          },
        ],
      },
      undefined,
    );
  });

  it('유효하지 않은 시험 식별자로 시험지 생성을 거부한다', async () => {
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

  it('시험 식별자를 확인한 뒤 시험지를 생성한다', async () => {
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

  it('선택한 시험이 학년 분류를 쓰면 학년 입력을 필수로 요구한다', async () => {
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

  it('일반 사용자에게는 비공개 시험지 상세를 숨긴다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getPublicPaper('paper_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findById).toHaveBeenCalledWith('paper_1', {
      isPublished: true,
    });
  });

  it('관리자는 공개 상태를 수정할 수 있다', async () => {
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

  it('관리자는 문제지 제목과 시행연도, 회차를 수정할 수 있다', async () => {
    const roundExam = { ...exam, usesRound: true };
    const roundSession = {
      ...examSession,
      key: 'exam_1:2025:-:-:75',
      round: 75,
      exam: roundExam,
    };
    repository.findById.mockResolvedValue(
      paper({ examSession: roundSession } as never) as never,
    );
    repository.update.mockResolvedValue(
      paper({
        title: '2026학년도 수능 한국사',
        examSession: {
          ...roundSession,
          displayYear: 2026,
          round: 76,
        },
      } as never),
    );

    const response = await service.updatePaper('paper_1', {
      title: '2026학년도 수능 한국사',
      year: 2026,
      round: 76,
    });

    expect(repository.update).toHaveBeenCalledWith('paper_1', {
      title: '2026학년도 수능 한국사',
      displayYear: 2026,
      round: 76,
    });
    expect(response.paper).toMatchObject({
      title: '2026학년도 수능 한국사',
      year: 2026,
      round: 76,
    });
  });

  it('시험지와 저장된 문항 이미지를 함께 삭제한다', async () => {
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

  it('풀이 기록이 있는 시험지 삭제를 거부한다', async () => {
    repository.findById.mockResolvedValue(paper() as never);
    repository.countQuestionAttempts.mockResolvedValue(1);

    let error: unknown;
    try {
      await service.deletePaper('paper_1');
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as Error).message).toBe(
      '풀이 기록이 있는 문제지는 삭제할 수 없습니다.',
    );
    expect(repository.delete).not.toHaveBeenCalled();
    expect(storageService.deleteObject).not.toHaveBeenCalled();
  });
});
