import { BadRequestException } from '@nestjs/common';
import { Tag, UserRole } from '@prisma/client';
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
      countSubjectsByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<TagsRepository>;

    service = new TagsService(repository);
  });

  it('returns only public fields for the regular tag list', async () => {
    repository.findManyAvailable.mockResolvedValue([
      makeTag({
        subjects: [{ tagId: 'tag_1', subjectId: 'subject_1', createdAt: now }],
      }),
    ]);

    const response = await service.listTags(UserRole.USER, 'subject_1');

    expect(repository.findManyAvailable).toHaveBeenCalledWith('subject_1');
    expect(response.tags[0]).not.toHaveProperty('subjectIds');
    expect(response.tags[0]).toMatchObject({
      id: 'tag_1',
      kind: 'OFFICIAL',
      isActive: true,
    });
  });

  it('returns subject scopes and timestamps for the admin list', async () => {
    repository.findMany.mockResolvedValue([
      makeTag({
        subjects: [{ tagId: 'tag_1', subjectId: 'subject_1', createdAt: now }],
      }),
    ]);

    const response = await service.listAdminTags();

    expect(response.tags[0]).toMatchObject({
      subjectIds: ['subject_1'],
      createdAt: now.toISOString(),
    });
  });

  it('rejects a newly assigned inactive or out-of-scope tag', async () => {
    repository.countAssignableByIds.mockResolvedValue(0);

    await expect(
      service.assertTagsAssignable(['tag_1'], 'subject_1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps an existing inactive tag without requiring reassignment', async () => {
    await service.assertTagsAssignable(['tag_1'], 'subject_1', ['tag_1']);

    expect(repository.countAssignableByIds).not.toHaveBeenCalled();
  });
});

function makeTag({
  subjects,
}: {
  subjects: Array<{ tagId: string; subjectId: string; createdAt: Date }>;
}): Tag & { subjects: typeof subjects } {
  return {
    id: 'tag_1',
    name: '조선',
    slug: 'joseon',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    subjects,
  };
}
