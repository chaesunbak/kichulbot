import {
  AdminTagResponse,
  CreateOfficialTagRequest,
  ListTagsResponse,
  ListTagsResponseSchema,
  OfficialTagMutationResponse,
  OfficialTagMutationResponseSchema,
  TagResponse,
  UpdateOfficialTagRequest,
} from '@kichulbot/api-contract/tags';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tag, TagSubject, UserRole } from '@prisma/client';
import { TagsRepository } from './tags.repository';

type TagWithSubjects = Tag & { subjects: TagSubject[] };

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async listTags(
    role: UserRole,
    subjectId?: string,
  ): Promise<ListTagsResponse> {
    const tags = await this.tagsRepository.findManyAvailable(subjectId);
    return ListTagsResponseSchema.parse({
      tags: tags.map((tag) => this.toResponse(tag, role)),
    });
  }

  async listAdminTags(): Promise<ListTagsResponse> {
    const tags = await this.tagsRepository.findMany();
    return ListTagsResponseSchema.parse({
      tags: tags.map((tag) => this.toResponse(tag, UserRole.ADMIN)),
    });
  }

  async createOfficialTag(
    dto: CreateOfficialTagRequest,
  ): Promise<OfficialTagMutationResponse> {
    const subjectIds = await this.assertSubjectsExist(dto.subjectIds);
    const tag = await this.tagsRepository.create(
      {
        name: dto.name.trim(),
        slug: dto.slug.trim(),
      },
      subjectIds,
    );

    return OfficialTagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async updateOfficialTag(
    id: string,
    dto: UpdateOfficialTagRequest,
  ): Promise<OfficialTagMutationResponse> {
    const existing = await this.tagsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('공식 태그를 찾을 수 없습니다.');
    }

    const subjectIds = dto.subjectIds
      ? await this.assertSubjectsExist(dto.subjectIds)
      : undefined;
    const tag = await this.tagsRepository.update(
      id,
      {
        name: dto.name?.trim(),
        slug: dto.slug?.trim(),
        isActive: dto.isActive,
      },
      subjectIds,
    );

    return OfficialTagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async assertTagsAssignable(
    tagIds: string[],
    subjectId: string,
    preservedTagIds: string[] = [],
  ) {
    const preserved = new Set(preservedTagIds);
    const newTagIds = [...new Set(tagIds)].filter((id) => !preserved.has(id));
    if (newTagIds.length === 0) {
      return;
    }

    const count = await this.tagsRepository.countAssignableByIds(
      newTagIds,
      subjectId,
    );
    if (count !== newTagIds.length) {
      throw new BadRequestException(
        '선택한 과목에 지정할 수 없는 공식 태그가 포함되어 있습니다.',
      );
    }
  }

  private async assertSubjectsExist(subjectIds: string[]) {
    const uniqueIds = [...new Set(subjectIds)];
    if (uniqueIds.length === 0) {
      return uniqueIds;
    }

    const count = await this.tagsRepository.countSubjectsByIds(uniqueIds);
    if (count !== uniqueIds.length) {
      throw new BadRequestException('과목을 찾을 수 없습니다.');
    }
    return uniqueIds;
  }

  private toResponse(
    tag: TagWithSubjects,
    role: UserRole,
  ): TagResponse | AdminTagResponse {
    const response = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      kind: 'OFFICIAL' as const,
      isActive: tag.isActive,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      subjectIds: tag.subjects.map(({ subjectId }) => subjectId),
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
