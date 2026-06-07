import { BadRequestException, NotFoundException } from '@nestjs/common';

import {
  QuestionReportCategory,
  QuestionReportStatus,
} from '../../infrastructure/database/prisma-client';
import type { QuestionReportsRepository } from './question-reports.repository';
import { QuestionReportsService } from './question-reports.service';

const now = new Date('2026-06-01T00:00:00.000Z');

describe('QuestionReportsService', () => {
  let service: QuestionReportsService;
  let repository: jest.Mocked<QuestionReportsRepository>;

  beforeEach(() => {
    repository = {
      findPublishedQuestion: jest.fn(),
      findQuestionRevision: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<QuestionReportsRepository>;
    service = new QuestionReportsService(repository);
  });

  it('로그인 사용자 신고에서 내용과 기본 리비전을 정규화해 저장한다', async () => {
    repository.findPublishedQuestion.mockResolvedValue(makeQuestion());
    repository.findQuestionRevision.mockResolvedValue({ id: 'revision_1' });
    repository.create.mockResolvedValue(makeReport({ content: '정답 오류' }));

    const response = await service.create('user_1', 'question_1', {
      category: QuestionReportCategory.ANSWER_ERROR,
      content: ' 정답 오류 ',
    });

    expect(repository.create).toHaveBeenCalledWith({
      reporterUserId: 'user_1',
      questionId: 'question_1',
      questionRevisionId: 'revision_1',
      category: QuestionReportCategory.ANSWER_ERROR,
      content: '정답 오류',
    });
    expect(response.report).toMatchObject({
      id: 'report_1',
      reporterUserId: 'user_1',
      questionRevisionId: 'revision_1',
    });
  });

  it('비로그인 신고는 신고자 식별자를 null로 저장한다', async () => {
    repository.findPublishedQuestion.mockResolvedValue(makeQuestion());
    repository.findQuestionRevision.mockResolvedValue({ id: 'revision_1' });
    repository.create.mockResolvedValue(makeReport({ reporterUserId: null }));

    await service.create(null, 'question_1', {
      category: QuestionReportCategory.IMAGE_ERROR,
      content: '이미지가 흐립니다.',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ reporterUserId: null }),
    );
  });

  it('신고 내용이 공백뿐이면 거부한다', async () => {
    repository.findPublishedQuestion.mockResolvedValue(makeQuestion());

    await expect(
      service.create('user_1', 'question_1', {
        category: QuestionReportCategory.OTHER,
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('문항과 일치하지 않는 리비전 신고는 거부한다', async () => {
    repository.findPublishedQuestion.mockResolvedValue(makeQuestion());
    repository.findQuestionRevision.mockResolvedValue(null);

    await expect(
      service.create('user_1', 'question_1', {
        category: QuestionReportCategory.ANSWER_ERROR,
        content: '정답이 이상합니다.',
        questionRevisionId: 'other_revision',
      }),
    ).rejects.toThrow('문항 리비전이 문항과 일치하지 않습니다.');
  });

  it('관리자 목록 조회 조건을 정규화하고 전체 페이지 수를 계산한다', async () => {
    repository.findMany.mockResolvedValue({
      reports: [makeReport()],
      total: 21,
    });

    const response = await service.listAdmin({
      page: 2,
      limit: 10,
      status: QuestionReportStatus.PENDING,
      questionId: ' question_1 ',
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      status: QuestionReportStatus.PENDING,
      category: undefined,
      questionId: 'question_1',
      page: 2,
      limit: 10,
    });
    expect(response).toMatchObject({
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('관리자 수정 값이 없으면 거부한다', async () => {
    await expect(
      service.updateAdmin('report_1', 'admin_1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('관리자 메모를 비우면 null로 저장하고 검토자를 남긴다', async () => {
    repository.findById.mockResolvedValue(makeReport());
    repository.update.mockResolvedValue(
      makeReport({
        status: QuestionReportStatus.RESOLVED,
        adminMemo: null,
        reviewedByUserId: 'admin_1',
        reviewedAt: now,
      }),
    );

    const response = await service.updateAdmin('report_1', 'admin_1', {
      status: QuestionReportStatus.RESOLVED,
      adminMemo: '   ',
    });

    expect(repository.update).toHaveBeenCalledWith('report_1', {
      status: QuestionReportStatus.RESOLVED,
      adminMemo: null,
      reviewedByUserId: 'admin_1',
      reviewedAt: expect.any(Date),
    });
    expect(response.report).toMatchObject({
      status: QuestionReportStatus.RESOLVED,
      adminMemo: null,
      reviewedByUserId: 'admin_1',
      reviewedAt: now.toISOString(),
    });
  });

  it('없는 신고 처리는 거부한다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateAdmin('report_1', 'admin_1', {
        status: QuestionReportStatus.DISMISSED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function makeQuestion() {
  return {
    id: 'question_1',
    paperId: 'paper_1',
    revisions: [{ id: 'revision_1' }],
  } as never;
}

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    ...baseReport(),
    ...overrides,
  } as never;
}

function baseReport() {
  return {
    id: 'report_1',
    reporterUserId: 'user_1',
    questionId: 'question_1',
    questionRevisionId: 'revision_1',
    category: QuestionReportCategory.ANSWER_ERROR,
    content: '정답 오류',
    status: QuestionReportStatus.PENDING,
    adminMemo: null,
    reviewedByUserId: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
    question: {
      id: 'question_1',
      paperId: 'paper_1',
      paper: { title: '2026학년도 수능 한국사' },
      number: 1,
    },
    reporter: {
      id: 'user_1',
      email: 'user@example.com',
      nickname: '사용자',
    },
    reviewedBy: null,
  };
}
