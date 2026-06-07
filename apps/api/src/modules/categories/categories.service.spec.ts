import { NotFoundException } from '@nestjs/common';

import { UserRole } from '../../infrastructure/database/prisma-client';
import type { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

const now = new Date('2026-06-01T00:00:00.000Z');

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepository>;
    service = new CategoriesService(repository);
  });

  it('일반 사용자 목록에서는 공개 필드만 반환한다', async () => {
    repository.findMany.mockResolvedValue([makeCategory()]);

    const response = await service.listCategories(UserRole.USER);

    expect(response.categories[0]).toEqual({
      id: 'category_1',
      name: '한국사',
    });
  });

  it('관리자 목록에서는 생성일과 수정일을 함께 반환한다', async () => {
    repository.findMany.mockResolvedValue([makeCategory()]);

    const response = await service.listCategories(UserRole.ADMIN);

    expect(response.categories[0]).toMatchObject({
      id: 'category_1',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it('분류 이름을 공백 제거 후 생성한다', async () => {
    repository.create.mockResolvedValue(makeCategory({ name: '한국사' }));

    await service.createCategory({ name: ' 한국사 ' });

    expect(repository.create).toHaveBeenCalledWith({ name: '한국사' });
  });

  it('없는 분류 수정은 거부한다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.updateCategory('category_1', { name: '세계사' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('없는 분류 삭제는 거부한다', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.deleteCategory('category_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });
});

function makeCategory(
  overrides: Partial<ReturnType<typeof baseCategory>> = {},
) {
  return {
    ...baseCategory(),
    ...overrides,
  };
}

function baseCategory() {
  return {
    id: 'category_1',
    name: '한국사',
    createdAt: now,
    updatedAt: now,
  };
}
