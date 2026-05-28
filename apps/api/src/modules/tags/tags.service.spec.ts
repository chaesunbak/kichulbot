import { Tag, TagCategory, UserRole } from '@prisma/client';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

const now = new Date('2026-05-28T00:00:00.000Z');

describe('TagsService', () => {
  let service: TagsService;
  let repository: jest.Mocked<TagsRepository>;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
    } as unknown as jest.Mocked<TagsRepository>;

    service = new TagsService(repository);
  });

  it('returns tags with admin fields only for admins', async () => {
    const tag: Tag = {
      id: 'tag_1',
      name: '조선',
      slug: 'joseon',
      category: TagCategory.PERIOD,
      createdAt: now,
      updatedAt: now,
    };
    repository.findMany.mockResolvedValue([tag]);

    const userResponse = await service.listTags(UserRole.USER);
    const adminResponse = await service.listTags(UserRole.ADMIN);

    expect(userResponse.tags[0]).not.toHaveProperty('createdAt');
    expect(adminResponse.tags[0]).toMatchObject({
      createdAt: now.toISOString(),
    });
  });
});
