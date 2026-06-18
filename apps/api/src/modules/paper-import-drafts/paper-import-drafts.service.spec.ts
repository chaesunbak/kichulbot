import { readFile } from 'node:fs/promises';

import type { ConfigService } from '@nestjs/config';

import type { DatabaseService } from '../../infrastructure/database/database.service';
import { UserRole } from '../../infrastructure/database/prisma-client';
import type { PapersService } from '../papers/papers.service';
import type { TagsService } from '../tags/tags.service';
import { PaperImportDraftsService } from './paper-import-drafts.service';

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

const now = new Date('2026-06-15T00:00:00.000Z');

describe('PaperImportDraftsService', () => {
  let service: PaperImportDraftsService;
  let paperImportJob: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  let papersService: jest.Mocked<PapersService>;
  let tagsService: jest.Mocked<TagsService>;

  beforeEach(() => {
    paperImportJob = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    const database = {
      paperImportJob,
    } as unknown as DatabaseService;
    papersService = {
      createPaperWithQuestions: jest.fn(),
      getAdminPaper: jest.fn(),
    } as unknown as jest.Mocked<PapersService>;
    tagsService = {
      matchRecommendedTagsBatch: jest.fn(),
    } as unknown as jest.Mocked<TagsService>;

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'storage.local.dir') return '/tmp/uploads';
        if (key === 'redis.url') return 'redis://localhost:6379';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new PaperImportDraftsService(
      database,
      configService,
      papersService,
      tagsService,
    );
  });

  it('extractor가 처리할 PDF 추출 작업 payload를 반환한다', async () => {
    paperImportJob.findUnique.mockResolvedValue(makeImportJob());

    await expect(service.getImportJobPayload('job_1')).resolves.toMatchObject({
      job: {
        id: 'job_1',
        questionPdfPath: 'paper-import-jobs/job_1/questions.pdf',
        questionPdfName: 'questions.pdf',
        answerPdfPath: 'paper-import-jobs/job_1/answers.pdf',
        paperInput: {
          title: '한국사 78회',
          examId: 'exam_1',
        },
      },
    });
  });

  it('PDF 추출 작업 상태를 처리 중으로 변경한다', async () => {
    paperImportJob.findUnique.mockResolvedValue(makeImportJob());
    paperImportJob.update.mockResolvedValue(
      makeImportJob({ status: 'PROCESSING', errorMessage: null }),
    );

    await expect(
      service.updateImportJobStatus('job_1', { status: 'PROCESSING' }),
    ).resolves.toMatchObject({
      job: {
        id: 'job_1',
        status: 'PROCESSING',
        errorMessage: null,
      },
    });

    expect(paperImportJob.update).toHaveBeenCalledWith({
      where: { id: 'job_1' },
      data: {
        status: 'PROCESSING',
        startedAt: expect.any(Date),
        failedAt: null,
        errorMessage: null,
        updatedAt: expect.any(Date),
      },
    });
  });

  it('PDF 추출 작업 결과 경로를 저장하고 완료 상태로 변경한다', async () => {
    paperImportJob.findUnique.mockResolvedValue(makeImportJob());
    paperImportJob.update.mockResolvedValue(
      makeImportJob({
        status: 'COMPLETED',
        resultJsonPath: 'paper-import-jobs/job_1/result.json',
      }),
    );

    await expect(
      service.saveImportJobResult('job_1', {
        resultJsonPath: 'paper-import-jobs/job_1/result.json',
      }),
    ).resolves.toMatchObject({
      job: {
        id: 'job_1',
        status: 'COMPLETED',
      },
    });

    expect(paperImportJob.update).toHaveBeenCalledWith({
      where: { id: 'job_1' },
      data: {
        status: 'COMPLETED',
        resultJsonPath: 'paper-import-jobs/job_1/result.json',
        completedAt: expect.any(Date),
        failedAt: null,
        errorMessage: null,
        updatedAt: expect.any(Date),
      },
    });
  });

  it('추출 결과를 읽어 추천 태그를 계산하고 문제지 생성 서비스로 전달한다', async () => {
    paperImportJob.findUnique.mockResolvedValue(makeImportJob());
    paperImportJob.update.mockResolvedValue(makeImportJob());
    jest.mocked(readFile).mockResolvedValue(JSON.stringify(makeDraftResult()));
    tagsService.matchRecommendedTagsBatch.mockResolvedValue([
      [{ tagId: 'tag_1', keywords: ['고려'] }],
    ]);
    papersService.createPaperWithQuestions.mockResolvedValue({
      paper: makePaperResponse('paper_1'),
    });

    await expect(
      service.createPaperFromImportJob('job_1'),
    ).resolves.toMatchObject({
      paper: { id: 'paper_1' },
    });

    expect(readFile).toHaveBeenCalledWith(
      '/tmp/uploads/paper-import-jobs/job_1/result.json',
      'utf8',
    );
    expect(tagsService.matchRecommendedTagsBatch).toHaveBeenCalledWith(
      'exam_1',
      [
        {
          text: '고려의 제도',
          promptText: '옳은 것은?',
          passageText: '고려 시대',
          choiceTexts: ['① 광종'],
        },
      ],
    );

    const [payload, images, role] =
      papersService.createPaperWithQuestions.mock.calls[0];
    expect(JSON.parse(payload)).toMatchObject({
      paper: {
        title: '한국사 78회',
        examId: 'exam_1',
        year: 2026,
        questionCount: 50,
      },
      questions: [
        {
          number: 1,
          recommendedTagIds: ['tag_1'],
          recommendedTagMatches: [{ tagId: 'tag_1', keywords: ['고려'] }],
          imageFileName: 'q01.webp',
        },
      ],
    });
    expect(images[0]).toMatchObject({
      fieldname: 'images',
      originalname: 'q01.webp',
      mimetype: 'image/webp',
      size: Buffer.from('image-bytes').byteLength,
    });
    expect(images[0]?.buffer.equals(Buffer.from('image-bytes'))).toBe(true);
    expect(role).toBe(UserRole.ADMIN);
    expect(paperImportJob.update).toHaveBeenCalledWith({
      where: { id: 'job_1' },
      data: {
        paperId: 'paper_1',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('이미 생성된 작업은 기존 문제지를 반환하고 중복 생성하지 않는다', async () => {
    paperImportJob.findUnique.mockResolvedValue(
      makeImportJob({ paperId: 'paper_existing' }),
    );
    papersService.getAdminPaper.mockResolvedValue({
      paper: { ...makePaperResponse('paper_existing'), questions: [] },
    });

    await expect(
      service.createPaperFromImportJob('job_1'),
    ).resolves.toMatchObject({
      paper: { id: 'paper_existing' },
    });

    expect(papersService.getAdminPaper).toHaveBeenCalledWith('paper_existing');
    expect(papersService.createPaperWithQuestions).not.toHaveBeenCalled();
    expect(paperImportJob.update).not.toHaveBeenCalled();
  });
});

function makeImportJob(overrides = {}) {
  return {
    id: 'job_1',
    status: 'COMPLETED',
    questionPdfPath: 'paper-import-jobs/job_1/questions.pdf',
    questionPdfName: 'questions.pdf',
    answerPdfPath: 'paper-import-jobs/job_1/answers.pdf',
    answerPdfName: 'answers.pdf',
    resultJsonPath: 'paper-import-jobs/job_1/result.json',
    paperId: null,
    paperInput: {
      title: '한국사 78회',
      year: 2026,
      examId: 'exam_1',
      questionCount: 50,
      isPublished: false,
      layout: 'korean-history',
      variant: 'odd',
      imageFormat: 'webp',
    },
    inputOptions: {},
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    completedAt: now,
    failedAt: null,
    ...overrides,
  };
}

function makeDraftResult() {
  return {
    paperSuggestion: {
      title: '한국사 78회',
      questionCount: 50,
    },
    warnings: [],
    questions: [
      {
        number: 1,
        type: 'MULTIPLE_CHOICE',
        choiceCount: 5,
        gradingPolicy: 'EXACT',
        answerChoice: 1,
        answerText: null,
        explanation: null,
        rawText: '고려의 제도',
        promptText: '옳은 것은?',
        passageText: '고려 시대',
        choiceTexts: ['① 광종'],
        points: 2,
        recommendedTimeSeconds: null,
        recommendedTagIds: [],
        recommendedTagMatches: [],
        tagIds: [],
        image: {
          filename: 'q01.webp',
          mimeType: 'image/webp',
          base64: Buffer.from('image-bytes').toString('base64'),
        },
        textLayer: {
          text: '고려의 제도',
          promptText: '옳은 것은?',
          passageText: '고려 시대',
          choiceTexts: ['① 광종'],
          lines: [],
        },
      },
    ],
  };
}

function makePaperResponse(id: string) {
  return {
    id,
    title: '한국사 78회',
    year: 2026,
    month: null,
    grade: null,
    round: 78,
    questionCount: 50,
    isInLibrary: false,
    exam: {
      id: 'exam_1',
      name: '한국사',
    },
    isPublished: false,
    registeredQuestionCount: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
