import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Prisma, UserRole } from '../../infrastructure/database/prisma-client';
import type { ExamsRepository } from './exams.repository';
import { ExamsService } from './exams.service';

const now = new Date('2026-06-01T00:00:00.000Z');

describe('ExamsService', () => {
  let service: ExamsService;
  let repository: jest.Mocked<ExamsRepository>;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteIfNoPapers: jest.fn(),
      countTagGroupsByIds: jest.fn().mockResolvedValue(1),
      countTagsByIdsInTagGroup: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<ExamsRepository>;
    service = new ExamsService(repository);
  });

  it('일반 사용자 목록에서는 공개 필드만 반환하고 학년 분류를 비활성화한다', async () => {
    repository.findMany.mockResolvedValue([makeExam({ usesGrade: true })]);

    const response = await service.listExams(UserRole.USER);

    expect(response.exams[0]).toEqual({
      id: 'exam_1',
      name: '수능',
      slug: 'korean-history',
      categories: [{ id: 'category_1', name: '한국사' }],
      usesMonth: true,
      usesGrade: false,
      usesRound: false,
      isMockExamAvailable: false,
    });
  });

  it('관리자 목록에서는 연결된 문제지 수와 타임스탬프를 반환한다', async () => {
    repository.findMany.mockResolvedValue([
      makeExam({
        sessions: [{ _count: { papers: 2 } }, { _count: { papers: 3 } }],
      }),
    ]);

    const response = await service.listExams(UserRole.ADMIN);

    expect(response.exams[0]).toMatchObject({
      paperCount: 5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('시험 생성 시 이름과 분류 식별자를 정규화하고 학년 분류를 끈다', async () => {
    repository.create.mockResolvedValue(makeExam({ name: '수능' }));

    await service.createExam({
      name: ' 수능 ',
      slug: 'korean-history',
      categoryIds: ['category_1', 'category_1', 'category_2'],
      usesMonth: true,
      usesGrade: true,
      usesRound: true,
    } as never);

    expect(repository.create).toHaveBeenCalledWith({
      name: '수능',
      slug: 'korean-history',
      categoryIds: ['category_1', 'category_2'],
      usesMonth: true,
      usesGrade: false,
      usesRound: true,
    });
  });

  it('모의고사 설정의 문항수 합계가 불가능하면 시험 수정을 거부한다', async () => {
    repository.findById.mockResolvedValue(makeExam());

    await expect(
      service.updateExam('exam_1', {
        mockExamQuestionCount: 3,
        eraTagGroupId: 'tag_group_1',
        mockExamBlueprintItems: [
          {
            tagId: 'tag_1',
            minQuestionCount: 4,
            maxQuestionCount: 5,
            sortOrder: 0,
          },
        ],
      }),
    ).rejects.toThrow('출제 범위의 최소 문항수 합계가 총 문항수보다 큽니다.');
  });

  it('없는 시험 수정은 거부한다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateExam('exam_1', { name: '모의고사' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('분류 외래키 오류를 잘못된 요청으로 매핑한다', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('외래키 오류', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createExam({
        name: '수능',
        slug: 'korean-history',
        categoryIds: ['missing_category'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('연결된 문제지가 있는 시험 삭제를 거부한다', async () => {
    repository.deleteIfNoPapers.mockResolvedValue({
      exam: makeExam(),
      paperCount: 1,
    });

    await expect(service.deleteExam('exam_1')).rejects.toThrow(
      '연결된 문제지가 있는 시험은 삭제할 수 없습니다.',
    );
  });

  it('없는 시험 삭제를 거부한다', async () => {
    repository.deleteIfNoPapers.mockResolvedValue({
      exam: null,
      paperCount: 0,
    });

    await expect(service.deleteExam('exam_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

function makeExam(overrides: Record<string, unknown> = {}) {
  return {
    ...baseExam(),
    ...overrides,
  } as never;
}

function baseExam() {
  return {
    id: 'exam_1',
    name: '수능',
    slug: 'korean-history',
    usesMonth: true,
    usesGrade: false,
    usesRound: false,
    mockExamQuestionCount: null,
    eraTagGroupId: null,
    createdAt: now,
    updatedAt: now,
    mockExamBlueprintItems: [],
    categories: [
      {
        examId: 'exam_1',
        categoryId: 'category_1',
        sortOrder: 0,
        createdAt: now,
        category: {
          id: 'category_1',
          name: '한국사',
          createdAt: now,
          updatedAt: now,
        },
      },
    ],
    sessions: [],
  };
}
