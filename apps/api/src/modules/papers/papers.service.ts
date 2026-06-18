import {
  AdminGetPaperResponse,
  AdminListPaperQuestionsResponse,
  AdminListPapersResponse,
  CreatePaperRequest,
  CreatePaperRequestSchema,
  CreatePaperResponse,
  CreatePaperWithQuestionsRequest,
  CreatePaperWithQuestionsRequestSchema,
  DeletePaperResponse,
  PublicGetPaperResponse,
  PublicListPaperQuestionsResponse,
  PublicListPapersResponse,
  UpdatePaperRequestSchema,
  UpdatePaperResponse,
} from '@kichulbot/api-contract/papers';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Exam, UserRole } from '../../infrastructure/database/prisma-client';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { ExamsService } from '../exams/exams.service';
import { QuestionsService } from '../questions/questions.service';
import { UpdatePaperDto } from './dto/update-paper.dto';
import { PapersRepository } from './papers.repository';
import type {
  AdminPaperDetailItem,
  AdminPaperItem,
  PaperDetailItem,
  PaperExamItem,
  PaperListRecord,
  PaperRecord,
} from './papers.types';

@Injectable()
export class PapersService {
  constructor(
    private readonly papersRepository: PapersRepository,
    private readonly examsService: ExamsService,
    private readonly storageService: StorageService,
    private readonly questionsService: QuestionsService,
  ) {}

  async createPaper(
    dto: unknown,
    role: UserRole,
  ): Promise<CreatePaperResponse> {
    if (role !== UserRole.ADMIN) {
      throw new BadRequestException('관리자만 문제지를 생성할 수 있습니다.');
    }

    const parsedDto = this.parseCreatePaperRequest(dto);
    const exam = await this.examsService.findById(parsedDto.examId);

    if (!exam) {
      throw new BadRequestException('시험을 찾을 수 없습니다.');
    }

    this.assertSessionFields(exam, parsedDto);

    const paper = await this.papersRepository.create({
      title: parsedDto.title,
      examId: parsedDto.examId,
      displayYear: parsedDto.year,
      month: parsedDto.month ?? null,
      grade: parsedDto.grade ?? null,
      round: parsedDto.round ?? null,
      questionCount: parsedDto.questionCount ?? 20,
      isPublished: parsedDto.isPublished ?? false,
    });

    return {
      paper: this.toAdminPaperItem(paper),
    };
  }

  async createPaperWithQuestions(
    payload: string,
    files: UploadedMemoryFile[],
    role: UserRole,
  ): Promise<CreatePaperResponse> {
    const input = this.parseCreatePaperWithQuestionsRequest(payload);
    this.assertBulkQuestionInput(input);
    const imageMap = this.toImageMap(files);

    for (const question of input.questions) {
      if (!imageMap.has(question.imageFileName)) {
        throw new BadRequestException(
          `${question.number}번 문항 이미지(${question.imageFileName})를 찾을 수 없습니다.`,
        );
      }
    }

    let paperId: string | null = null;
    try {
      const { paper } = await this.createPaper(input.paper, role);
      paperId = paper.id;

      for (const question of input.questions) {
        const image = imageMap.get(question.imageFileName);
        if (!image) continue;
        await this.questionsService.createQuestion(
          {
            paperId,
            number: question.number,
            type: question.type,
            choiceCount: question.choiceCount ?? undefined,
            gradingPolicy: question.gradingPolicy,
            answerChoice: question.answerChoice ?? undefined,
            answerText: question.answerText ?? undefined,
            explanation: question.explanation ?? undefined,
            rawText: question.rawText ?? undefined,
            promptText: question.promptText ?? undefined,
            passageText: question.passageText ?? undefined,
            choiceTexts: question.choiceTexts,
            points: question.points,
            recommendedTimeSeconds:
              question.recommendedTimeSeconds ?? undefined,
            recommendedTagIds: question.recommendedTagIds,
            recommendedTagMatches: question.recommendedTagMatches,
            tagIds: question.tagIds,
          },
          image,
        );
      }

      return this.getAdminPaper(paperId);
    } catch (error) {
      if (paperId) {
        await this.deletePaper(paperId).catch(() => undefined);
      }
      throw error;
    }
  }

  async listAdminPapers(
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<AdminListPapersResponse> {
    return {
      papers: await this.listPaperItems(UserRole.ADMIN, userId, filters),
    };
  }

  async listPublicPapers(
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<PublicListPapersResponse> {
    return {
      papers: await this.listPaperItems(UserRole.USER, userId, filters),
    };
  }

  async getAdminPaper(
    id: string,
    userId?: string,
  ): Promise<AdminGetPaperResponse> {
    return {
      paper: await this.findPaperItem(id, UserRole.ADMIN, userId),
    };
  }

  async getPublicPaper(
    id: string,
    userId?: string,
  ): Promise<PublicGetPaperResponse> {
    return {
      paper: await this.findPaperItem(id, UserRole.USER, userId),
    };
  }

  private async listPaperItems(
    role: typeof UserRole.ADMIN,
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<AdminPaperItem[]>;
  private async listPaperItems(
    role: typeof UserRole.USER,
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<PaperDetailItem[]>;
  private async listPaperItems(
    role: UserRole,
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<Array<PaperDetailItem | AdminPaperItem>> {
    const examId = filters?.examId?.trim();
    const categoryId = filters?.categoryId?.trim();
    const q = filters?.q?.trim();
    const papers = await this.papersRepository.findManyForList(
      {
        ...(role === UserRole.ADMIN ? {} : { isPublished: true }),
        ...(examId || categoryId
          ? {
              examSession: {
                ...(examId ? { examId } : {}),
                ...(categoryId
                  ? {
                      exam: {
                        categories: { some: { categoryId } },
                      },
                    }
                  : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                {
                  examSession: {
                    exam: { name: { contains: q, mode: 'insensitive' } },
                  },
                },
              ],
            }
          : {}),
      },
      userId,
    );

    return papers.map((paper) =>
      role === UserRole.ADMIN
        ? this.toAdminPaperListItem(paper)
        : this.toPublicPaperListItem(paper),
    );
  }

  private async findPaperItem(
    id: string,
    role: typeof UserRole.ADMIN,
    userId?: string,
  ): Promise<AdminPaperDetailItem>;
  private async findPaperItem(
    id: string,
    role: typeof UserRole.USER,
    userId?: string,
  ): Promise<PaperDetailItem>;
  private async findPaperItem(
    id: string,
    role: UserRole,
    userId?: string,
  ): Promise<PaperDetailItem | AdminPaperDetailItem> {
    const where = role === UserRole.ADMIN ? {} : { isPublished: true };
    const paper = userId
      ? await this.papersRepository.findById(id, where, userId)
      : await this.papersRepository.findById(id, where);

    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    return role === UserRole.ADMIN
      ? this.toAdminPaperDetailItem(paper)
      : this.toPublicPaperItem(paper);
  }

  async listAdminPaperQuestions(
    id: string,
    userId?: string,
  ): Promise<AdminListPaperQuestionsResponse> {
    return this.listPaperQuestionItems(id, UserRole.ADMIN, userId);
  }

  async listPublicPaperQuestions(
    id: string,
    userId?: string,
  ): Promise<PublicListPaperQuestionsResponse> {
    return this.listPaperQuestionItems(id, UserRole.USER, userId);
  }

  private async listPaperQuestionItems(
    id: string,
    role: UserRole,
    userId?: string,
  ) {
    const where = role === UserRole.ADMIN ? {} : { isPublished: true };
    const paper = userId
      ? await this.papersRepository.findById(id, where, userId)
      : await this.papersRepository.findById(id, where);

    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const questions = paper.questions ?? [];
    const bookmarkedQuestionIds = userId
      ? new Set(
          await this.papersRepository.findBookmarkedQuestionIds(
            userId,
            questions.map((question) => question.id),
          ),
        )
      : new Set<string>();

    return {
      paper: this.toPublicPaperItem(paper),
      questions: questions.map((question) => {
        const revision = question.revisions?.[0];

        return {
          id: question.id,
          questionRevisionId: revision?.id ?? question.id,
          number: question.number,
          type: question.type,
          imageUrl: question.imageUrl,
          imageCacheKey: this.toImageCacheKey(question.imageHash),
          choiceCount: question.choiceCount,
          gradingPolicy: revision?.gradingPolicy ?? question.gradingPolicy,
          answerChoice: revision?.answerChoice ?? question.answerChoice,
          answerText: revision?.answerText ?? question.answerText,
          explanation: revision?.explanation ?? question.explanation,
          rawText: revision?.rawText ?? question.rawText,
          promptText: revision?.promptText ?? question.promptText,
          passageText: revision?.passageText ?? question.passageText,
          choiceTexts: revision?.choiceTexts ?? question.choiceTexts,
          points: question.points,
          recommendedTimeSeconds: question.recommendedTimeSeconds,
          recommendedTagIds: question.recommendedTagIds,
          recommendedTagMatches: toRecommendedTagMatches(
            question.recommendedTagMatches,
          ),
          isBookmarked: bookmarkedQuestionIds.has(question.id),
        };
      }),
    };
  }

  async updatePaper(
    id: string,
    dto: UpdatePaperDto,
  ): Promise<UpdatePaperResponse> {
    const parsedDto = this.parseUpdatePaperRequest(dto);
    const paper = await this.papersRepository.findById(id);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const nextSession = {
      month: paper.examSession.month,
      grade: paper.examSession.grade,
      round:
        parsedDto.round !== undefined
          ? parsedDto.round
          : paper.examSession.round,
    };
    this.assertSessionFields(paper.examSession.exam, nextSession);

    const updateInput: Parameters<PapersRepository['update']>[1] = {};
    if (parsedDto.title !== undefined) updateInput.title = parsedDto.title;
    if (parsedDto.year !== undefined) updateInput.displayYear = parsedDto.year;
    if (parsedDto.round !== undefined) updateInput.round = parsedDto.round;
    if (parsedDto.isPublished !== undefined) {
      updateInput.isPublished = parsedDto.isPublished;
    }

    const updated = await this.papersRepository.update(id, updateInput);

    return {
      paper: this.toAdminPaperItem(updated),
    };
  }

  async deletePaper(id: string): Promise<DeletePaperResponse> {
    const paper = await this.papersRepository.findById(id);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const questionAttemptCount =
      await this.papersRepository.countQuestionAttempts(id);
    if (questionAttemptCount > 0) {
      throw new ConflictException(
        '풀이 기록이 있는 문제지는 삭제할 수 없습니다.',
      );
    }

    await this.papersRepository.delete(id);
    await Promise.all(
      (paper.questions ?? []).map((question) =>
        this.deleteStoredImage(question.imageUrl),
      ),
    );

    return { id };
  }

  private toPublicPaperItem(paper: PaperRecord): PaperDetailItem {
    return {
      id: paper.id,
      title: paper.title,
      year: paper.examSession.displayYear,
      month: paper.examSession.month,
      grade: paper.examSession.grade,
      round: paper.examSession.round,
      questionCount: paper.questionCount,
      isInLibrary: (paper.users?.length ?? 0) > 0,
      exam: this.toPaperExamItem(paper.examSession.exam),
    };
  }

  private toAdminPaperItem(paper: PaperRecord): AdminPaperItem {
    return {
      ...this.toPublicPaperItem(paper),
      isPublished: paper.isPublished,
      registeredQuestionCount: paper.questions?.length ?? 0,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
    };
  }

  private toAdminPaperDetailItem(paper: PaperRecord): AdminPaperDetailItem {
    return {
      ...this.toAdminPaperItem(paper),
      questions: (paper.questions ?? []).map((question) => ({
        id: question.id,
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
        tags:
          question.tags?.map((questionTag) => ({
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
          })) ?? [],
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
      })),
    };
  }

  private toPublicPaperListItem(paper: PaperListRecord): PaperDetailItem {
    return {
      id: paper.id,
      title: paper.title,
      year: paper.examSession.displayYear,
      month: paper.examSession.month,
      grade: paper.examSession.grade,
      round: paper.examSession.round,
      questionCount: paper.questionCount,
      isInLibrary: (paper.users?.length ?? 0) > 0,
      exam: this.toPaperExamItem(paper.examSession.exam),
    };
  }

  private toAdminPaperListItem(paper: PaperListRecord): AdminPaperItem {
    return {
      ...this.toPublicPaperListItem(paper),
      isPublished: paper.isPublished,
      registeredQuestionCount: paper._count.questions,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
    };
  }

  private toPaperExamItem(entity: Exam): PaperExamItem {
    return {
      id: entity.id,
      name: entity.name,
    };
  }

  private toImageCacheKey(imageHash: string): string {
    return imageHash.startsWith('legacy_') ? imageHash : `sha256_${imageHash}`;
  }

  private assertSessionFields(
    exam: Exam,
    dto: Pick<CreatePaperRequest, 'month' | 'grade' | 'round'>,
  ) {
    this.assertSessionField(exam.usesMonth, dto.month, '시행 월');
    this.assertSessionField(exam.usesGrade, dto.grade, '대상 학년');
    this.assertSessionField(exam.usesRound, dto.round, '시험 회차');
  }

  private parseCreatePaperRequest(input: unknown) {
    const result = CreatePaperRequestSchema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => issue.message),
      );
    }
    return result.data;
  }

  private parseCreatePaperWithQuestionsRequest(
    payload: string,
  ): CreatePaperWithQuestionsRequest {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException(
        '문제지 생성 payload가 올바른 JSON이 아닙니다.',
      );
    }

    const result = CreatePaperWithQuestionsRequestSchema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => issue.message),
      );
    }
    return result.data;
  }

  private parseUpdatePaperRequest(input: unknown) {
    const result = UpdatePaperRequestSchema.safeParse(input);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map((issue) => issue.message),
      );
    }
    return result.data;
  }

  private assertBulkQuestionInput(input: CreatePaperWithQuestionsRequest) {
    if (input.questions.length > (input.paper.questionCount ?? 20)) {
      throw new BadRequestException(
        '등록할 문항 수는 문제지 문항 수를 넘을 수 없습니다.',
      );
    }

    const numbers = new Set<number>();
    for (const question of input.questions) {
      if (numbers.has(question.number)) {
        throw new BadRequestException(
          `${question.number}번 문항이 중복되었습니다.`,
        );
      }
      numbers.add(question.number);
    }
  }

  private toImageMap(files: UploadedMemoryFile[]) {
    const map = new Map<string, UploadedMemoryFile>();
    for (const file of files) {
      map.set(file.originalname, file);
    }
    return map;
  }

  private assertSessionField(
    isUsed: boolean,
    value: number | null | undefined,
    label: string,
  ) {
    if (isUsed && value == null) {
      throw new BadRequestException(`${label}을 입력해주세요.`);
    }
    if (!isUsed && value != null) {
      throw new BadRequestException(`${label}을 입력할 수 없는 시험입니다.`);
    }
  }

  private async deleteStoredImage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      return;
    }

    const marker = '/questions/';
    const index = imageUrl.indexOf(marker);
    if (index !== -1) {
      await this.storageService
        .deleteObject(imageUrl.slice(index + 1))
        .catch(() => undefined);
    }
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
