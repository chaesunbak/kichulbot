import {
  AdminTagGroupResponse,
  AdminTagResponse,
  CreateTagGroupRequest,
  CreateTagRequest,
  DeleteTagGroupResponse,
  DeleteTagGroupResponseSchema,
  DeleteTagResponse,
  DeleteTagResponseSchema,
  ListTagGroupsResponse,
  ListTagGroupsResponseSchema,
  ListTagsResponse,
  ListTagsResponseSchema,
  TagGroupMutationResponse,
  TagGroupMutationResponseSchema,
  TagGroupResponse,
  TagMutationResponse,
  TagMutationResponseSchema,
  TagResponse,
  UpdateTagGroupRequest,
  UpdateTagRequest,
} from '@kichulbot/api-contract/tags';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Tag,
  TagGroup,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { TagsRepository } from './tags.repository';

type TagWithExam = Tag & {
  tagGroup?: TagGroup | null;
  _count?: { questions: number };
};

type TagGroupWithCount = TagGroup & {
  _count?: { tags: number };
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

  async createTag(dto: CreateTagRequest): Promise<TagMutationResponse> {
    await this.assertExamExists(dto.examId);
    await this.assertTagGroupAssignable(dto.tagGroupId ?? null, dto.examId);

    const tag = await this.tagsRepository.create({
      name: dto.name.trim(),
      keywords: this.normalizeKeywords(dto.keywords),
      examId: dto.examId,
      tagGroupId: dto.tagGroupId ?? null,
    });

    return TagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async updateTag(
    id: string,
    dto: UpdateTagRequest,
  ): Promise<TagMutationResponse> {
    const existing = await this.tagsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('태그를 찾을 수 없습니다.');
    }

    if (dto.examId) {
      await this.assertExamExists(dto.examId);
    }

    const examId = dto.examId ?? existing.examId;
    const tagGroupId =
      dto.tagGroupId === undefined ? existing.tagGroupId : dto.tagGroupId;
    await this.assertTagGroupAssignable(tagGroupId, examId);

    const tag = await this.tagsRepository.update(id, {
      name: dto.name?.trim(),
      keywords:
        dto.keywords === undefined
          ? undefined
          : this.normalizeKeywords(dto.keywords),
      examId: dto.examId,
      tagGroupId: dto.tagGroupId,
    });

    return TagMutationResponseSchema.parse({
      tag: this.toResponse(tag, UserRole.ADMIN),
    });
  }

  async deleteTag(id: string): Promise<DeleteTagResponse> {
    const result = await this.tagsRepository.deleteIfUnused(id);

    if (!result.tag) {
      throw new NotFoundException('태그를 찾을 수 없습니다.');
    }

    if (result.questionCount > 0) {
      throw new BadRequestException('문항에 연결된 태그는 삭제할 수 없습니다.');
    }

    return DeleteTagResponseSchema.parse({ id });
  }

  async listTagGroups(examId?: string): Promise<ListTagGroupsResponse> {
    const tagGroups = await this.tagsRepository.findManyTagGroups(examId);
    return ListTagGroupsResponseSchema.parse({
      tagGroups: tagGroups.map((tagGroup) => this.toTagGroupResponse(tagGroup)),
    });
  }

  async createTagGroup(
    dto: CreateTagGroupRequest,
  ): Promise<TagGroupMutationResponse> {
    await this.assertExamExists(dto.examId);
    const tagGroup = await this.tagsRepository.createTagGroup({
      examId: dto.examId,
      name: dto.name.trim(),
      selectionMode: dto.selectionMode,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return TagGroupMutationResponseSchema.parse({
      tagGroup: this.toTagGroupResponse(tagGroup),
    });
  }

  async updateTagGroup(
    id: string,
    dto: UpdateTagGroupRequest,
  ): Promise<TagGroupMutationResponse> {
    const existing = await this.tagsRepository.findTagGroupById(id);
    if (!existing) {
      throw new NotFoundException('태그 그룹을 찾을 수 없습니다.');
    }

    if (dto.examId) {
      await this.assertExamExists(dto.examId);
      if (dto.examId !== existing.examId && existing._count?.tags) {
        throw new BadRequestException(
          '태그가 연결된 그룹은 다른 시험으로 이동할 수 없습니다.',
        );
      }
    }

    const tagGroup = await this.tagsRepository.updateTagGroup(id, {
      examId: dto.examId,
      name: dto.name?.trim(),
      selectionMode: dto.selectionMode,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });

    return TagGroupMutationResponseSchema.parse({
      tagGroup: this.toTagGroupResponse(tagGroup),
    });
  }

  async deleteTagGroup(id: string): Promise<DeleteTagGroupResponse> {
    const result = await this.tagsRepository.deleteTagGroupIfUnused(id);

    if (!result.tagGroup) {
      throw new NotFoundException('태그 그룹을 찾을 수 없습니다.');
    }

    if (result.tagCount > 0) {
      throw new BadRequestException('태그가 연결된 그룹은 삭제할 수 없습니다.');
    }

    return DeleteTagGroupResponseSchema.parse({ id });
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

  private async assertTagGroupAssignable(
    tagGroupId: string | null | undefined,
    examId: string,
  ) {
    if (!tagGroupId) {
      return;
    }

    const count = await this.tagsRepository.countTagGroupsByIds(
      [tagGroupId],
      examId,
    );
    if (count !== 1) {
      throw new BadRequestException(
        '선택한 시험에 지정할 수 없는 태그 그룹입니다.',
      );
    }
  }

  private toTagGroupBaseResponse(tagGroup: TagGroup): TagGroupResponse {
    return {
      id: tagGroup.id,
      examId: tagGroup.examId,
      name: tagGroup.name,
      selectionMode: tagGroup.selectionMode,
      sortOrder: tagGroup.sortOrder,
      isActive: tagGroup.isActive,
    };
  }

  private toTagGroupResponse(
    tagGroup: TagGroupWithCount,
  ): AdminTagGroupResponse {
    return {
      ...this.toTagGroupBaseResponse(tagGroup),
      tagCount: tagGroup._count?.tags ?? 0,
      createdAt: tagGroup.createdAt.toISOString(),
      updatedAt: tagGroup.updatedAt.toISOString(),
    };
  }

  private toResponse(
    tag: TagWithExam,
    role: UserRole,
  ): TagResponse | AdminTagResponse {
    const response = {
      id: tag.id,
      name: tag.name,
      keywords: tag.keywords,
      tagGroup: tag.tagGroup ? this.toTagGroupBaseResponse(tag.tagGroup) : null,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      examId: tag.examId,
      tagGroupId: tag.tagGroupId,
      questionCount: tag._count?.questions ?? 0,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }

  private normalizeKeywords(keywords?: string[]) {
    return [
      ...new Set(
        (keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean),
      ),
    ];
  }
}
