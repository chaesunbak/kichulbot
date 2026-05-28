import {
  AdminTagResponse,
  ListTagsResponse,
  ListTagsResponseSchema,
  TagResponse,
} from '@kichulbot/api-contract/tags';
import { Injectable } from '@nestjs/common';
import { Tag, UserRole } from '@prisma/client';
import { TagsRepository } from './tags.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async listTags(role: UserRole): Promise<ListTagsResponse> {
    const tags = await this.tagsRepository.findMany();
    return ListTagsResponseSchema.parse({
      tags: tags.map((tag) => this.toResponse(tag, role)),
    });
  }

  private toResponse(tag: Tag, role: UserRole): TagResponse | AdminTagResponse {
    const response = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
