import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { TagsRepository } from './tags.repository';
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

  it('returns only public fields for the regular tag list', async () => {
    repository.findManyAvailable.mockResolvedValue([makeTag()]);

    const response = await service.listTags(UserRole.USER, 'exam_1');

    expect(repository.findManyAvailable).toHaveBeenCalledWith('exam_1');
    expect(response.tags[0]).not.toHaveProperty('examId');
    expect(response.tags[0]).toMatchObject({
      id: 'tag_1',
      kind: 'OFFICIAL',
    });
  });

  it('returns exam scopes and timestamps for the admin list', async () => {
    repository.findMany.mockResolvedValue([makeTag()]);

    const response = await service.listAdminTags();

    expect(response.tags[0]).toMatchObject({
      examId: 'exam_1',
      questionCount: 0,
      createdAt: now.toISOString(),
    });
  });

  it('returns question counts for an admin filtered tag list', async () => {
    repository.findManyAvailable.mockResolvedValue([makeTag()]);

    const response = await service.listTags(UserRole.ADMIN, 'exam_1');

    expect(repository.findManyAvailable).toHaveBeenCalledWith('exam_1');
    expect(response.tags[0]).toMatchObject({
      examId: 'exam_1',
      questionCount: 0,
      createdAt: now.toISOString(),
    });
  });

  it('deletes an unused official tag', async () => {
    repository.deleteIfUnused.mockResolvedValue({
      tag: makeTag(),
      questionCount: 0,
    });

    await expect(service.deleteOfficialTag('tag_1')).resolves.toEqual({
      id: 'tag_1',
    });
  });

  it('rejects deleting a tag attached to questions', async () => {
    repository.deleteIfUnused.mockResolvedValue({
      tag: makeTag(),
      questionCount: 1,
    });

    await expect(service.deleteOfficialTag('tag_1')).rejects.toThrow(
      '문항에 연결된 태그는 삭제할 수 없습니다.',
    );
  });

  it('rejects a newly assigned out-of-scope tag', async () => {
    repository.countAssignableByIds.mockResolvedValue(0);

    await expect(
      service.assertTagsAssignable(['tag_1'], 'exam_1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps an existing out-of-scope tag without requiring reassignment', async () => {
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
