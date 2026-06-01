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
import { Tag, TagExam, UserRole } from '@prisma/client';

import { TagsRepository } from './tags.repository';

type TagWithExams = Tag & { exams: TagExam[] };

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  async listTags(role: UserRole, examId?: string): Promise<ListTagsResponse> {
    const tags = await this.tagsRepository.findManyAvailable(examId);
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
    const examIds = await this.assertExamsExist(dto.examIds);
    const tag = await this.tagsRepository.create(
      {
        name: dto.name.trim(),
      },
      examIds,
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

    const examIds = dto.examIds
      ? await this.assertExamsExist(dto.examIds)
      : undefined;
    const tag = await this.tagsRepository.update(
      id,
      {
        name: dto.name?.trim(),
        isActive: dto.isActive,
      },
      examIds,
    );

    return OfficialTagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async assertTagsAssignable(
    tagIds: string[],
    examId: string,
    preservedTagIds: string[] = [],
  ) {
    const preserved = new Set(preservedTagIds);
    const newTagIds = [...new Set(tagIds)].filter((id) => !preserved.has(id));
    if (newTagIds.length === 0) {
      return;
    }

    const count = await this.tagsRepository.countAssignableByIds(
      newTagIds,
      examId,
    );
    if (count !== newTagIds.length) {
      throw new BadRequestException(
        '선택한 시험에 지정할 수 없는 공식 태그가 포함되어 있습니다.',
      );
    }
  }

  private async assertExamsExist(examIds: string[]) {
    const uniqueIds = [...new Set(examIds)];
    if (uniqueIds.length === 0) {
      return uniqueIds;
    }

    const count = await this.tagsRepository.countExamsByIds(uniqueIds);
    if (count !== uniqueIds.length) {
      throw new BadRequestException('시험을 찾을 수 없습니다.');
    }
    return uniqueIds;
  }

  private toResponse(
    tag: TagWithExams,
    role: UserRole,
  ): TagResponse | AdminTagResponse {
    const response = {
      id: tag.id,
      name: tag.name,
      kind: 'OFFICIAL' as const,
      isActive: tag.isActive,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      examIds: tag.exams.map(({ examId }) => examId),
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
