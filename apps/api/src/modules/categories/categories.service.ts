import {
  AdminListCategoriesResponse,
  CategoryMutationResponse,
  DeleteCategoryResponse,
  PublicListCategoriesResponse,
} from '@kichulbot/api-contract/taxonomy';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Category } from '../../infrastructure/database/prisma-client';
import { CategoriesRepository } from './categories.repository';
import type { AdminCategoryItem, CategoryItem } from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async listAdminCategories(): Promise<AdminListCategoriesResponse> {
    const categories = await this.categoriesRepository.findMany();
    return {
      categories: categories.map((category) =>
        this.toAdminCategoryItem(category),
      ),
    };
  }

  async listPublicCategories(): Promise<PublicListCategoriesResponse> {
    const categories = await this.categoriesRepository.findMany();
    return {
      categories: categories.map((category) => this.toCategoryItem(category)),
    };
  }

  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<CategoryMutationResponse> {
    const category = await this.categoriesRepository.create({
      name: dto.name.trim(),
    });

    return {
      category: this.toAdminCategoryItem(category),
    };
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

    return {
      category: this.toAdminCategoryItem(category),
    };
  }

  async deleteCategory(id: string): Promise<DeleteCategoryResponse> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('분류를 찾을 수 없습니다.');
    }

    await this.categoriesRepository.delete(id);

    return { id };
  }

  private toCategoryItem(category: Category): CategoryItem {
    return {
      id: category.id,
      name: category.name,
    };
  }

  private toAdminCategoryItem(category: Category): AdminCategoryItem {
    return {
      ...this.toCategoryItem(category),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
