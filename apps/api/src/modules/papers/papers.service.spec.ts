import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Exam, Paper, Question, Subject, UserRole } from '@prisma/client';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { ExamsService } from '../exams/exams.service';
import { SubjectsService } from '../subjects/subjects.service';
import { PapersRepository } from './papers.repository';
import { PapersService } from './papers.service';

const now = new Date('2026-05-28T00:00:00.000Z');

const exam: Exam = {
  id: 'exam_1',
  name: '수능',
  slug: 'suneung',
  createdAt: now,
  updatedAt: now,
};

const subject: Subject = {
  id: 'subject_1',
  name: '한국사',
  slug: 'korean-history',
  createdAt: now,
  updatedAt: now,
};

const paper = (
  overrides: Partial<Paper> = {},
): Paper & {
  exam: Exam;
  subject: Subject;
  questions: Question[];
} => ({
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  year: 2025,
  questionCount: 20,
  isPublished: false,
  examId: exam.id,
  subjectId: subject.id,
  createdAt: now,
  updatedAt: now,
  exam,
  subject,
  questions: [],
  ...overrides,
});

describe('PapersService', () => {
  let service: PapersService;
  let repository: jest.Mocked<PapersRepository>;
  let examsService: jest.Mocked<ExamsService>;
  let subjectsService: jest.Mocked<SubjectsService>;
  let storageService: jest.Mocked<StorageService>;

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
    subjectsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<SubjectsService>;
    storageService = {
      uploadQuestionImage: jest.fn(),
      getPublicUrl: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    service = new PapersService(
      repository,
      examsService,
      subjectsService,
      storageService,
    );
  });

  it('returns only published papers for normal users without admin fields', async () => {
    repository.findMany.mockResolvedValue([paper({ isPublished: true })]);

    const response = await service.listPapers(UserRole.USER);

    expect(repository.findMany).toHaveBeenCalledWith({ isPublished: true });
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

    expect(repository.findMany).toHaveBeenCalledWith({});
    expect(response.papers[0]).toMatchObject({
      id: 'paper_1',
      isPublished: false,
      registeredQuestionCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('rejects creating a paper when taxonomy ids are invalid', async () => {
    examsService.findById.mockResolvedValue(null);
    subjectsService.findById.mockResolvedValue(subject);

    await expect(
      service.createPaper(
        {
          title: '2025학년도 수능 한국사',
          year: 2025,
          examId: 'missing_exam',
          subjectId: subject.id,
        },
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a paper after checking exam and subject ids', async () => {
    examsService.findById.mockResolvedValue(exam);
    subjectsService.findById.mockResolvedValue(subject);
    repository.create.mockResolvedValue(paper({ isPublished: true }));

    const response = await service.createPaper(
      {
        title: '2025학년도 수능 한국사',
        year: 2025,
        examId: exam.id,
        subjectId: subject.id,
        isPublished: true,
      },
      UserRole.ADMIN,
    );

    expect(repository.create).toHaveBeenCalledWith({
      title: '2025학년도 수능 한국사',
      year: 2025,
      examId: exam.id,
      subjectId: subject.id,
      questionCount: 20,
      isPublished: true,
    });
    expect(response.paper).toMatchObject({ isPublished: true });
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
