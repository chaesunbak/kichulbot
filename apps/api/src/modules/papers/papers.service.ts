import {
  AdminPaperResponse,
  CreatePaperRequestSchema,
  CreatePaperResponse,
  CreatePaperResponseSchema,
  CreatePaperWithQuestionsRequest,
  CreatePaperWithQuestionsRequestSchema,
  DeletePaperResponse,
  DeletePaperResponseSchema,
  GetPaperResponse,
  GetPaperResponseSchema,
  ListPaperQuestionsResponse,
  ListPaperQuestionsResponseSchema,
  ListPapersResponse,
  ListPapersResponseSchema,
  PaperResponse,
  UpdatePaperResponse,
  UpdatePaperResponseSchema,
} from '@kichulbot/api-contract/papers';
import { TaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Exam,
  ExamSession,
  Paper,
  Prisma,
  Question,
  QuestionRevision,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { ExamsService } from '../exams/exams.service';
import { QuestionsService } from '../questions/questions.service';
import { CreatePaperDto } from './dto/create-paper.dto';
import { UpdatePaperDto } from './dto/update-paper.dto';
import { PapersRepository } from './papers.repository';

type PaperWithRelations = Paper & {
  examSession: ExamSession & { exam: Exam };
  questions?: Array<
    Question & {
      revisions?: QuestionRevision[];
      tags?: Array<
        Prisma.QuestionTagGetPayload<{
          include: { tag: true };
        }>
      >;
    }
  >;
  users?: Array<{ id: string }>;
};

@Injectable()
export class PapersService {
  constructor(
    private readonly papersRepository: PapersRepository,
    private readonly examsService: ExamsService,
    private readonly storageService: StorageService,
    private readonly questionsService: QuestionsService,
  ) {}

  async createPaper(
    dto: CreatePaperDto,
    role: UserRole,
  ): Promise<CreatePaperResponse> {
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

    return CreatePaperResponseSchema.parse({
      paper: this.toPaperResponse(paper, role),
    });
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
            answerChoice: question.answerChoice ?? undefined,
            answerText: question.answerText ?? undefined,
            explanation: question.explanation ?? undefined,
            points: question.points,
            recommendedTimeSeconds:
              question.recommendedTimeSeconds ?? undefined,
            tagIds: question.tagIds,
          },
          image,
        );
      }

      return this.getPaper(paperId, role) as Promise<CreatePaperResponse>;
    } catch (error) {
      if (paperId) {
        await this.deletePaper(paperId).catch(() => undefined);
      }
      throw error;
    }
  }

  async listPapers(
    role: UserRole,
    userId?: string,
    filters?: { examId?: string; categoryId?: string; q?: string },
  ): Promise<ListPapersResponse> {
    const examId = filters?.examId?.trim();
    const categoryId = filters?.categoryId?.trim();
    const q = filters?.q?.trim();
    const papers = await this.papersRepository.findMany(
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

    return ListPapersResponseSchema.parse({
      papers: papers.map((paper) => this.toPaperResponse(paper, role)),
    });
  }

  async getPaper(
    id: string,
    role: UserRole,
    userId?: string,
  ): Promise<GetPaperResponse> {
    const where = role === UserRole.ADMIN ? {} : { isPublished: true };
    const paper = userId
      ? await this.papersRepository.findById(id, where, userId)
      : await this.papersRepository.findById(id, where);

    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    return GetPaperResponseSchema.parse({
      paper: this.toPaperResponse(paper, role),
    });
  }

  async listPaperQuestions(
    id: string,
    role: UserRole,
    userId?: string,
  ): Promise<ListPaperQuestionsResponse> {
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

    return ListPaperQuestionsResponseSchema.parse({
      paper: this.toPaperResponse(paper, UserRole.USER),
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
          answerChoice: revision?.answerChoice ?? question.answerChoice,
          answerText: revision?.answerText ?? question.answerText,
          explanation: revision?.explanation ?? question.explanation,
          points: question.points,
          recommendedTimeSeconds: question.recommendedTimeSeconds,
          isBookmarked: bookmarkedQuestionIds.has(question.id),
        };
      }),
    });
  }

  async updatePaper(
    id: string,
    dto: UpdatePaperDto,
  ): Promise<UpdatePaperResponse> {
    const paper = await this.papersRepository.findById(id);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    const updated = await this.papersRepository.update(id, {
      isPublished: dto.isPublished,
    });

    return UpdatePaperResponseSchema.parse({
      paper: this.toPaperResponse(updated, UserRole.ADMIN),
    });
  }

  async deletePaper(id: string): Promise<DeletePaperResponse> {
    const paper = await this.papersRepository.findById(id);
    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    await this.papersRepository.delete(id);
    await Promise.all(
      (paper.questions ?? []).map((question) =>
        this.deleteStoredImage(question.imageUrl),
      ),
    );

    return DeletePaperResponseSchema.parse({ id });
  }

  private toPaperResponse(
    paper: PaperWithRelations,
    role: UserRole,
  ): PaperResponse | AdminPaperResponse {
    const base = {
      id: paper.id,
      title: paper.title,
      year: paper.examSession.displayYear,
      month: paper.examSession.month,
      grade: paper.examSession.grade,
      round: paper.examSession.round,
      questionCount: paper.questionCount,
      isInLibrary: (paper.users?.length ?? 0) > 0,
      exam: this.toTaxonomyResponse(paper.examSession.exam),
    };

    if (role !== UserRole.ADMIN) {
      return base;
    }

    const response = {
      ...base,
      isPublished: paper.isPublished,
      registeredQuestionCount: paper.questions?.length ?? 0,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString(),
    };

    if (!paper.questions) {
      return response;
    }

    return {
      ...response,
      questions: paper.questions.map((question) => ({
        id: question.id,
        number: question.number,
        type: question.type,
        imageUrl: question.imageUrl,
        imageCacheKey: this.toImageCacheKey(question.imageHash),
        choiceCount: question.choiceCount,
        answerChoice: question.answerChoice,
        answerText: question.answerText,
        explanation: question.explanation,
        points: question.points,
        recommendedTimeSeconds: question.recommendedTimeSeconds,
        tags:
          question.tags?.map((questionTag) => ({
            id: questionTag.tag.id,
            name: questionTag.tag.name,
            kind: 'OFFICIAL',
          })) ?? [],
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
      })),
    };
  }

  private toTaxonomyResponse(entity: Exam): TaxonomyResponse {
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
    dto: Pick<CreatePaperDto, 'month' | 'grade' | 'round'>,
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
