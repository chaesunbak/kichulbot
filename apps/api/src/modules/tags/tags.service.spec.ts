import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

const now = new Date('2026-05-28T00:00:00.000Z');

describe('TagsService', () => {
  let service: TagsService;
  let repository: jest.Mocked<TagsRepository>;

  beforeEach(() => {
    repository = {
      findManyAvailable: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      countAssignableByIds: jest.fn(),
      existsExamById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteIfUnused: jest.fn(),
    } as unknown as jest.Mocked<TagsRepository>;

    service = new TagsService(repository);
  });

  it('일반 태그 목록에서는 공개 필드만 반환한다', async () => {
    repository.findManyAvailable.mockResolvedValue([makeTag()]);

    const response = await service.listTags(UserRole.USER, 'exam_1');

    expect(repository.findManyAvailable).toHaveBeenCalledWith('exam_1');
    expect(response.tags[0]).not.toHaveProperty('examId');
    expect(response.tags[0]).toMatchObject({
      id: 'tag_1',
      kind: 'OFFICIAL',
    });
  });

  it('관리자 태그 목록에서는 시험 범위와 타임스탬프를 반환한다', async () => {
    repository.findMany.mockResolvedValue([makeTag()]);

    const response = await service.listAdminTags();

    expect(response.tags[0]).toMatchObject({
      examId: 'exam_1',
      questionCount: 0,
      createdAt: now.toISOString(),
    });
  });

  it('관리자 필터 태그 목록에서는 문항 수를 함께 반환한다', async () => {
    repository.findManyAvailable.mockResolvedValue([makeTag()]);

    const response = await service.listTags(UserRole.ADMIN, 'exam_1');

    expect(repository.findManyAvailable).toHaveBeenCalledWith('exam_1');
    expect(response.tags[0]).toMatchObject({
      examId: 'exam_1',
      questionCount: 0,
      createdAt: now.toISOString(),
    });
  });

  it('사용되지 않은 공식 태그를 삭제한다', async () => {
    repository.deleteIfUnused.mockResolvedValue({
      tag: makeTag(),
      questionCount: 0,
    });

    await expect(service.deleteOfficialTag('tag_1')).resolves.toEqual({
      id: 'tag_1',
    });
  });

  it('문항에 연결된 태그 삭제를 거부한다', async () => {
    repository.deleteIfUnused.mockResolvedValue({
      tag: makeTag(),
      questionCount: 1,
    });

    await expect(service.deleteOfficialTag('tag_1')).rejects.toThrow(
      '문항에 연결된 태그는 삭제할 수 없습니다.',
    );
  });

  it('범위를 벗어난 새 태그 할당을 거부한다', async () => {
    repository.countAssignableByIds.mockResolvedValue(0);

    await expect(
      service.assertTagsAssignable(['tag_1'], 'exam_1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('기존에 연결된 범위 밖 태그는 재할당 없이 유지한다', async () => {
    await service.assertTagsAssignable(['tag_1'], 'exam_1', ['tag_1']);

    expect(repository.countAssignableByIds).not.toHaveBeenCalled();
  });
});

function makeTag() {
  return {
    id: 'tag_1',
    name: '조선',
    examId: 'exam_1',
    tagGroupId: null,
    tagGroup: null,
    createdAt: now,
    updatedAt: now,
    _count: { questions: 0 },
  };
}
