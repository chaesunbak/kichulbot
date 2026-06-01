import {
  AdminTagResponse,
  CreateOfficialTagRequest,
  DeleteOfficialTagResponse,
  DeleteOfficialTagResponseSchema,
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
import { Tag, UserRole } from '@prisma/client';

import { TagsRepository } from './tags.repository';

type TagWithExam = Tag & {
  _count?: { questions: number };
};

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
    await this.assertExamExists(dto.examId);
    const tag = await this.tagsRepository.create({
      name: dto.name.trim(),
      examId: dto.examId,
    });

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
      throw new NotFoundException('태그를 찾을 수 없습니다.');
    }

    if (dto.examId) {
      await this.assertExamExists(dto.examId);
    }
    const tag = await this.tagsRepository.update(id, {
      name: dto.name?.trim(),
      examId: dto.examId,
    });

    return OfficialTagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async deleteOfficialTag(id: string): Promise<DeleteOfficialTagResponse> {
    const result = await this.tagsRepository.deleteIfUnused(id);

    if (!result.tag) {
      throw new NotFoundException('태그를 찾을 수 없습니다.');
    }

    if (result.questionCount > 0) {
      throw new BadRequestException('문항에 연결된 태그는 삭제할 수 없습니다.');
    }

    return DeleteOfficialTagResponseSchema.parse({ id });
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
        '선택한 시험에 지정할 수 없는 태그가 포함되어 있습니다.',
      );
    }
  }

  private async assertExamExists(examId: string) {
    const exists = await this.tagsRepository.existsExamById(examId);
    if (!exists) {
      throw new BadRequestException('시험을 찾을 수 없습니다.');
    }
  }

  private toResponse(
    tag: TagWithExam,
    role: UserRole,
  ): TagResponse | AdminTagResponse {
    const response = {
      id: tag.id,
      name: tag.name,
      kind: 'OFFICIAL' as const,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      examId: tag.examId,
      questionCount: tag._count?.questions ?? 0,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
