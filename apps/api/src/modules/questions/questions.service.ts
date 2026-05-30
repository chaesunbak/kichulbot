import {
  AdminQuestionResponse,
  QuestionMutationResponse,
  QuestionMutationResponseSchema,
} from '@kichulbot/api-contract/questions';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UploadedImageFile } from '../../infrastructure/storage/storage.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsRepository } from './questions.repository';

type QuestionWithTags = Prisma.QuestionGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly storageService: StorageService,
  ) {}

  async createQuestion(
    dto: CreateQuestionDto,
    file?: UploadedImageFile,
  ): Promise<QuestionMutationResponse> {
    if (!file) {
      throw new BadRequestException('문제 이미지를 업로드해주세요.');
    }

    const paper = await this.questionsRepository.findPaper(dto.paperId);
    if (!paper) {
      throw new BadRequestException('문제지를 찾을 수 없습니다.');
    }

    this.assertAnswerWithinChoices(dto.answer, dto.choiceCount);

    const tagIds = dto.tagIds ?? [];
    await this.assertTagsExist(tagIds);

    let created: QuestionWithTags;
    try {
      created = await this.questionsRepository.create(
        {
          paperId: dto.paperId,
          number: dto.number,
          choiceCount: dto.choiceCount,
          answer: dto.answer,
          imageUrl: null,
        },
        tagIds,
      );
    } catch (error) {
      throw this.mapKnownError(error);
    }

    try {
      const { url } = await this.storageService.uploadQuestionImage(
        file,
        created.id,
      );
      const updated = await this.questionsRepository.updateImageUrl(
        created.id,
        url,
      );
      return this.toMutationResponse(updated);
    } catch (error) {
      // 이미지 저장 실패 시 방금 만든 문제 레코드를 정리한다.
      await this.questionsRepository.delete(created.id).catch(() => undefined);
      throw error;
    }
  }

  async updateQuestion(
    id: string,
    dto: UpdateQuestionDto,
    file?: UploadedImageFile,
  ): Promise<QuestionMutationResponse> {
    const existing = await this.questionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('문제를 찾을 수 없습니다.');
    }

    const nextAnswer = dto.answer ?? existing.answer;
    const nextChoiceCount = dto.choiceCount ?? existing.choiceCount;
    this.assertAnswerWithinChoices(nextAnswer, nextChoiceCount);

    if (dto.tagIds) {
      await this.assertTagsExist(dto.tagIds);
    }

    const data: Prisma.QuestionUncheckedUpdateInput = {
      number: dto.number,
      choiceCount: dto.choiceCount,
      answer: dto.answer,
    };

    if (file) {
      const { url } = await this.storageService.uploadQuestionImage(file, id);
      data.imageUrl = url;
      await this.deleteStaleImage(existing.imageUrl, url);
    }

    let updated: QuestionWithTags;
    try {
      updated = await this.questionsRepository.update(id, data, dto.tagIds);
    } catch (error) {
      throw this.mapKnownError(error);
    }

    return this.toMutationResponse(updated);
  }

  private assertAnswerWithinChoices(answer: number, choiceCount: number) {
    if (answer > choiceCount) {
      throw new BadRequestException(
        '정답 번호는 선택지 개수를 넘을 수 없습니다.',
      );
    }
  }

  private async assertTagsExist(tagIds: string[]) {
    if (tagIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(tagIds)];
    const found = await this.questionsRepository.countTagsByIds(uniqueIds);
    if (found !== uniqueIds.length) {
      throw new BadRequestException('존재하지 않는 태그가 포함되어 있습니다.');
    }
  }

  private async deleteStaleImage(
    previousUrl: string | null,
    nextUrl: string,
  ): Promise<void> {
    if (!previousUrl || previousUrl === nextUrl) {
      return;
    }

    const objectKey = this.extractObjectKey(previousUrl);
    if (objectKey) {
      await this.storageService.deleteObject(objectKey).catch(() => undefined);
    }
  }

  private extractObjectKey(url: string): string | null {
    const marker = '/questions/';
    const index = url.indexOf(marker);
    return index === -1 ? null : url.slice(index + 1);
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new BadRequestException('이미 등록된 문항 번호입니다.');
    }
    return error;
  }

  private toMutationResponse(
    question: QuestionWithTags,
  ): QuestionMutationResponse {
    return QuestionMutationResponseSchema.parse({
      question: this.toResponse(question),
    });
  }

  private toResponse(question: QuestionWithTags): AdminQuestionResponse {
    return {
      id: question.id,
      paperId: question.paperId,
      number: question.number,
      imageUrl: question.imageUrl,
      choiceCount: question.choiceCount,
      answer: question.answer,
      tags: question.tags.map((questionTag) => ({
        id: questionTag.tag.id,
        name: questionTag.tag.name,
        slug: questionTag.tag.slug,
        category: questionTag.tag.category,
      })),
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }
}
