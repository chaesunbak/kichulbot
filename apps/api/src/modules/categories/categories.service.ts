import {
  AdminTaxonomyResponse,
  CategoryMutationResponse,
  CategoryMutationResponseSchema,
  DeleteCategoryResponse,
  DeleteCategoryResponseSchema,
  ListCategoriesResponse,
  ListCategoriesResponseSchema,
  TaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Category,
  UserRole,
} from '../../infrastructure/database/prisma-client';

import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async listCategories(role: UserRole): Promise<ListCategoriesResponse> {
    const categories = await this.categoriesRepository.findMany();
    return ListCategoriesResponseSchema.parse({
      categories: categories.map((category) => this.toResponse(category, role)),
    });
  }

  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<CategoryMutationResponse> {
    const category = await this.categoriesRepository.create({
      name: dto.name.trim(),
    });

    return CategoryMutationResponseSchema.parse({
      category: this.toResponse(category, UserRole.ADMIN),
    });
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryMutationResponse> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('분류를 찾을 수 없습니다.');
    }

    const category = await this.categoriesRepository.update(id, {
      name: dto.name?.trim(),
    });

    return CategoryMutationResponseSchema.parse({
      category: this.toResponse(category, UserRole.ADMIN),
    });
  }

  async deleteCategory(id: string): Promise<DeleteCategoryResponse> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('분류를 찾을 수 없습니다.');
    }

    await this.categoriesRepository.delete(id);

    return DeleteCategoryResponseSchema.parse({ id });
  }

  private toResponse(
    category: Category,
    role: UserRole,
  ): TaxonomyResponse | AdminTaxonomyResponse {
    const response = {
      id: category.id,
      name: category.name,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
