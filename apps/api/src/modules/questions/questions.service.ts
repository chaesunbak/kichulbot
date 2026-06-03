import { randomUUID } from 'node:crypto';

import {
  AdminQuestionResponse,
  DeleteQuestionResponse,
  DeleteQuestionResponseSchema,
  QuestionMutationResponse,
  QuestionMutationResponseSchema,
} from '@kichulbot/api-contract/questions';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  QuestionType,
} from '../../infrastructure/database/prisma-client';

import { StorageService } from '../../infrastructure/storage/storage.service';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { TagsService } from '../tags/tags.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsRepository } from './questions.repository';

type QuestionWithTags = Prisma.QuestionGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

type QuestionAnswerInput = {
  choiceCount?: number;
  answerChoice?: number;
  answerText?: string;
};

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly storageService: StorageService,
    private readonly tagsService: TagsService,
  ) {}

  async createQuestion(
    dto: CreateQuestionDto,
    file?: UploadedMemoryFile,
  ): Promise<QuestionMutationResponse> {
    if (!file) {
      throw new BadRequestException('문제 이미지를 업로드해주세요.');
    }

    const paper = await this.questionsRepository.findPaper(dto.paperId);
    if (!paper) {
      throw new BadRequestException('문제지를 찾을 수 없습니다.');
    }

    this.assertNumberWithinPaper(dto.number, paper.questionCount);
    const answerData = this.resolveAnswerData(
      dto.type ?? QuestionType.MULTIPLE_CHOICE,
      dto,
    );

    const tagIds = dto.tagIds ?? [];
    await this.tagsService.assertTagsAssignable(
      tagIds,
      paper.examSession.examId,
    );

    const id = randomUUID();
    let uploadedObjectKey: string | null = null;

    try {
      const { objectKey, url } = await this.storageService.uploadQuestionImage(
        file,
        id,
      );
      uploadedObjectKey = objectKey;

      const created = await this.questionsRepository.create(
        {
          id,
          paperId: dto.paperId,
          number: dto.number,
          ...answerData,
          explanation: dto.explanation?.trim() || null,
          points: dto.points ?? 5,
          recommendedTimeSeconds: dto.recommendedTimeSeconds,
          imageUrl: url,
        },
        tagIds,
      );
      return this.toMutationResponse(created);
    } catch (error) {
      if (uploadedObjectKey) {
        await this.storageService
          .deleteObject(uploadedObjectKey)
          .catch(() => undefined);
      }
      throw this.mapKnownError(error);
    }
  }

  async updateQuestion(
    id: string,
    dto: UpdateQuestionDto,
    file?: UploadedMemoryFile,
  ): Promise<QuestionMutationResponse> {
    const existing = await this.questionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('문제를 찾을 수 없습니다.');
    }

    const answerData = this.resolveAnswerData(
      dto.type ?? existing.type,
      dto,
      existing,
    );

    const paper =
      dto.number || dto.tagIds
        ? await this.questionsRepository.findPaper(existing.paperId)
        : null;

    if (dto.number) {
      if (!paper) {
        throw new BadRequestException('문제지를 찾을 수 없습니다.');
      }
      this.assertNumberWithinPaper(dto.number, paper.questionCount);
    }

    if (dto.tagIds) {
      if (!paper) {
        throw new BadRequestException('문제지를 찾을 수 없습니다.');
      }
      await this.tagsService.assertTagsAssignable(
        dto.tagIds,
        paper.examSession.examId,
        existing.tags.map(({ tagId }) => tagId),
      );
    }

    const data: Prisma.QuestionUncheckedUpdateInput = {
      number: dto.number,
      ...answerData,
      explanation:
        dto.explanation === undefined
          ? undefined
          : dto.explanation.trim() || null,
      points: dto.points,
      recommendedTimeSeconds: dto.recommendedTimeSeconds,
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

  async deleteQuestion(id: string): Promise<DeleteQuestionResponse> {
    const existing = await this.questionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('문제를 찾을 수 없습니다.');
    }

    await this.questionsRepository.delete(id);
    await this.deleteStoredImage(existing.imageUrl);

    return DeleteQuestionResponseSchema.parse({ id });
  }

  private resolveAnswerData(
    type: QuestionType,
    input: QuestionAnswerInput,
    existing?: QuestionWithTags,
  ) {
    if (type === QuestionType.MULTIPLE_CHOICE) {
      const choiceCount =
        input.choiceCount ??
        (existing?.type === QuestionType.MULTIPLE_CHOICE
          ? existing.choiceCount
          : null);
      const answerChoice =
        input.answerChoice ??
        (existing?.type === QuestionType.MULTIPLE_CHOICE
          ? existing.answerChoice
          : null);

      if (choiceCount === null || answerChoice === null) {
        throw new BadRequestException(
          '객관식 문항은 선택지 개수와 정답 번호를 입력해주세요.',
        );
      }
      if (answerChoice > choiceCount) {
        throw new BadRequestException(
          '정답 번호는 선택지 개수를 넘을 수 없습니다.',
        );
      }

      return {
        type,
        choiceCount,
        answerChoice,
        answerText: null,
      };
    }

    const answerText = (
      input.answerText ??
      (existing?.type === QuestionType.WRITTEN ? existing.answerText : '')
    )?.trim();
    if (!answerText) {
      throw new BadRequestException('서술형 문항은 모범답안을 입력해주세요.');
    }

    return {
      type,
      choiceCount: null,
      answerChoice: null,
      answerText,
    };
  }

  private assertNumberWithinPaper(number: number, questionCount: number) {
    if (number > questionCount) {
      throw new BadRequestException(
        '문항 번호는 문제지 문항 수를 넘을 수 없습니다.',
      );
    }
  }

  private async deleteStaleImage(
    previousUrl: string,
    nextUrl: string,
  ): Promise<void> {
    if (!previousUrl || previousUrl === nextUrl) {
      return;
    }

    await this.deleteStoredImage(previousUrl);
  }

  private async deleteStoredImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      return;
    }

    const objectKey = this.extractObjectKey(imageUrl);
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
      type: question.type,
      imageUrl: question.imageUrl,
      choiceCount: question.choiceCount,
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      points: question.points,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      tags: question.tags.map((questionTag) => ({
        id: questionTag.tag.id,
        name: questionTag.tag.name,
        kind: 'OFFICIAL',
      })),
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }
}
