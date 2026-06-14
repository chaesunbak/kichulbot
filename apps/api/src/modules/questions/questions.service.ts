import { createHash, randomUUID } from 'node:crypto';

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
  GradingPolicy,
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
  include: { tags: { include: { tag: { include: { tagGroup: true } } } } };
}>;

type QuestionAnswerInput = {
  choiceCount?: number;
  gradingPolicy?: GradingPolicy;
  answerChoice?: number;
  answerText?: string;
};

type QuestionImagePathPaper = NonNullable<
  Awaited<ReturnType<QuestionsRepository['findPaper']>>
>;

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
    const recommendedTagIds = dto.recommendedTagIds ?? [];
    await this.tagsService.assertTagsAssignable(
      recommendedTagIds,
      paper.examSession.examId,
    );

    const id = randomUUID();
    let uploadedObjectKey: string | null = null;

    try {
      const { objectKey, url } = await this.storageService.uploadQuestionImage(
        file,
        this.createQuestionImagePathContext(id, paper, dto.number),
      );
      uploadedObjectKey = objectKey;
      const imageHash = this.createImageHash(file);

      const created = await this.questionsRepository.create(
        {
          id,
          paperId: dto.paperId,
          number: dto.number,
          ...answerData,
          explanation: dto.explanation?.trim() || null,
          rawText: dto.rawText?.trim() || null,
          promptText: dto.promptText?.trim() || null,
          passageText: dto.passageText?.trim() || null,
          choiceTexts: this.normalizeChoiceTexts(dto.choiceTexts),
          points: dto.points ?? 5,
          recommendedTimeSeconds: dto.recommendedTimeSeconds,
          recommendedTagIds,
          recommendedTagMatches: dto.recommendedTagMatches ?? [],
          imageUrl: url,
          imageHash,
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
      dto.number || dto.tagIds || dto.recommendedTagIds
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

    if (dto.recommendedTagIds) {
      if (!paper) {
        throw new BadRequestException('문제지를 찾을 수 없습니다.');
      }
      await this.tagsService.assertTagsAssignable(
        dto.recommendedTagIds,
        paper.examSession.examId,
      );
    }

    const data: Prisma.QuestionUncheckedUpdateInput = {
      number: dto.number,
      ...answerData,
      explanation:
        dto.explanation === undefined
          ? undefined
          : dto.explanation.trim() || null,
      rawText:
        dto.rawText === undefined ? undefined : dto.rawText.trim() || null,
      promptText:
        dto.promptText === undefined
          ? undefined
          : dto.promptText.trim() || null,
      passageText:
        dto.passageText === undefined
          ? undefined
          : dto.passageText.trim() || null,
      choiceTexts:
        dto.choiceTexts === undefined
          ? undefined
          : this.normalizeChoiceTexts(dto.choiceTexts),
      points: dto.points,
      recommendedTimeSeconds: dto.recommendedTimeSeconds,
      recommendedTagIds: dto.recommendedTagIds,
      recommendedTagMatches: dto.recommendedTagMatches,
    };

    if (file) {
      const paper = await this.questionsRepository.findPaper(existing.paperId);
      if (!paper) {
        throw new BadRequestException('문제지를 찾을 수 없습니다.');
      }
      const questionNumber = dto.number ?? existing.number;
      const { url } = await this.storageService.uploadQuestionImage(
        file,
        this.createQuestionImagePathContext(id, paper, questionNumber),
      );
      data.imageUrl = url;
      data.imageHash = this.createImageHash(file);
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
      const gradingPolicy =
        input.gradingPolicy ??
        (existing?.type === QuestionType.MULTIPLE_CHOICE
          ? existing.gradingPolicy
          : GradingPolicy.EXACT);
      const answerChoice =
        input.answerChoice ??
        (existing?.type === QuestionType.MULTIPLE_CHOICE
          ? existing.answerChoice
          : null);

      if (choiceCount === null) {
        throw new BadRequestException(
          '객관식 문항은 선택지 개수를 입력해주세요.',
        );
      }
      if (gradingPolicy === GradingPolicy.EXACT && answerChoice === null) {
        throw new BadRequestException(
          '객관식 문항은 정답 번호를 입력해주세요.',
        );
      }
      if (answerChoice !== null && answerChoice > choiceCount) {
        throw new BadRequestException(
          '정답 번호는 선택지 개수를 넘을 수 없습니다.',
        );
      }

      return {
        type,
        choiceCount,
        gradingPolicy,
        answerChoice:
          gradingPolicy === GradingPolicy.ANY_CHOICE ? null : answerChoice,
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
      gradingPolicy: GradingPolicy.EXACT,
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

  private createImageHash(file: UploadedMemoryFile): string {
    return createHash('sha256').update(file.buffer).digest('hex');
  }

  private createQuestionImagePathContext(
    questionId: string,
    paper: QuestionImagePathPaper,
    questionNumber: number,
  ) {
    return {
      questionId,
      examSlug: paper.examSession.exam.slug,
      paperSlug: this.createPaperSlug(paper.examSession),
      questionNumber,
    };
  }

  private createPaperSlug(paper: QuestionImagePathPaper['examSession']) {
    if (paper.round !== null) {
      return String(paper.round);
    }

    const parts = [String(paper.displayYear)];
    if (paper.month !== null) {
      parts.push(paper.month.toString().padStart(2, '0'));
    }
    if (paper.grade !== null) {
      parts.push(`grade-${paper.grade}`);
    }

    return parts.join('-');
  }

  private toImageCacheKey(imageHash: string): string {
    return imageHash.startsWith('legacy_') ? imageHash : `sha256_${imageHash}`;
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
      imageCacheKey: this.toImageCacheKey(question.imageHash),
      choiceCount: question.choiceCount,
      gradingPolicy: question.gradingPolicy,
      answerChoice: question.answerChoice,
      answerText: question.answerText,
      explanation: question.explanation,
      rawText: question.rawText,
      promptText: question.promptText,
      passageText: question.passageText,
      choiceTexts: question.choiceTexts,
      points: question.points,
      recommendedTimeSeconds: question.recommendedTimeSeconds,
      recommendedTagIds: question.recommendedTagIds,
      recommendedTagMatches: toRecommendedTagMatches(
        question.recommendedTagMatches,
      ),
      tags: question.tags.map((questionTag) => ({
        id: questionTag.tag.id,
        name: questionTag.tag.name,
        keywords: questionTag.tag.keywords,
        sortOrder: questionTag.tag.sortOrder,
        tagGroup: questionTag.tag.tagGroup
          ? {
              id: questionTag.tag.tagGroup.id,
              examId: questionTag.tag.tagGroup.examId,
              name: questionTag.tag.tagGroup.name,
              selectionMode: questionTag.tag.tagGroup.selectionMode,
              sortOrder: questionTag.tag.tagGroup.sortOrder,
              isActive: questionTag.tag.tagGroup.isActive,
            }
          : null,
      })),
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };
  }

  private normalizeChoiceTexts(choiceTexts?: string[]) {
    return choiceTexts?.map((text) => text.trim()).filter(Boolean) ?? [];
  }
}

function toRecommendedTagMatches(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const tagId = (item as { tagId?: unknown }).tagId;
      const keywords = (item as { keywords?: unknown }).keywords;
      if (typeof tagId !== 'string' || !Array.isArray(keywords)) return null;
      return {
        tagId,
        keywords: keywords.filter(
          (keyword): keyword is string => typeof keyword === 'string',
        ),
      };
    })
    .filter(
      (item): item is { tagId: string; keywords: string[] } => item !== null,
    );
}
