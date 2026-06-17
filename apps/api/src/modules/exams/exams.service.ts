import {
  AdminExamResponse,
  DeleteExamResponse,
  DeleteExamResponseSchema,
  ExamMutationResponse,
  ExamMutationResponseSchema,
  ExamResponse,
  ListExamPaperOverviewsQuerySchema,
  ListExamPaperOverviewsResponse,
  ListExamPaperOverviewsResponseSchema,
  ListExamsResponse,
  ListExamsResponseSchema,
} from '@kichulbot/api-contract/taxonomy';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Category,
  Exam,
  ExamCategory,
  MockExamBlueprintItem,
  Prisma,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamsRepository } from './exams.repository';

type ExamWithCategories = Exam & {
  categories: Array<ExamCategory & { category: Category }>;
  mockExamBlueprintItems?: MockExamBlueprintItem[];
  sessions?: Array<{ _count: { papers: number } }>;
};

type MockExamBlueprintItemInput = NonNullable<
  CreateExamDto['mockExamBlueprintItems']
>[number];

const DEFAULT_PAPER_OVERVIEW_LIMIT = 4;

@Injectable()
export class ExamsService {
  constructor(private readonly examsRepository: ExamsRepository) {}

  async listExams(role: UserRole): Promise<ListExamsResponse> {
    const exams = await this.examsRepository.findMany();
    return ListExamsResponseSchema.parse({
      exams: exams.map((exam) => this.toResponse(exam, role)),
    });
  }

  async listPublicPaperOverviews(
    query: { paperLimit?: unknown } = {},
  ): Promise<ListExamPaperOverviewsResponse> {
    const { paperLimit = DEFAULT_PAPER_OVERVIEW_LIMIT } =
      ListExamPaperOverviewsQuerySchema.parse(query);
    const overviews =
      await this.examsRepository.findManyPublicPaperOverviews(paperLimit);

    return ListExamPaperOverviewsResponseSchema.parse({
      overviews: overviews.map((overview) => ({
        exam: {
          id: overview.id,
          name: overview.name,
          slug: overview.slug,
          categories: overview.categories,
          usesMonth: overview.usesMonth,
          usesGrade: false,
          usesRound: overview.usesRound,
          isMockExamAvailable: overview.isMockExamAvailable,
        },
        paperCount: overview.paperCount,
        papers: overview.papers.map((paper) => ({
          ...paper,
          isInLibrary: false,
          exam: {
            id: overview.id,
            name: overview.name,
          },
        })),
      })),
    });
  }

  async findById(id: string) {
    const exam = await this.examsRepository.findById(id);
    return this.disableGradeClassification(exam);
  }

  async createExam(dto: CreateExamDto): Promise<ExamMutationResponse> {
    this.assertNoMockExamSettingsOnCreate(dto);
    const categoryIds = this.normalizeCategoryIds(dto.categoryIds ?? []);
    const exam = await this.examsRepository
      .create({
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        categoryIds,
        usesMonth: dto.usesMonth ?? false,
        usesGrade: false,
        usesRound: dto.usesRound ?? false,
      })
      .catch((error: unknown) => {
        throw this.mapKnownError(error);
      });

    return ExamMutationResponseSchema.parse({
      exam: this.toResponse(exam, UserRole.ADMIN),
    });
  }

  async updateExam(
    id: string,
    dto: UpdateExamDto,
  ): Promise<ExamMutationResponse> {
    const existing = await this.examsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    const categoryIds =
      dto.categoryIds !== undefined
        ? this.normalizeCategoryIds(dto.categoryIds)
        : undefined;
    await this.assertMockExamSettings(existing, dto);
    const exam = await this.examsRepository
      .update(id, {
        name: dto.name?.trim(),
        slug: dto.slug?.trim(),
        categoryIds,
        usesMonth: dto.usesMonth,
        usesGrade: false,
        usesRound: dto.usesRound,
        mockExamQuestionCount: dto.mockExamQuestionCount,
        eraTagGroupId: dto.eraTagGroupId,
        mockExamBlueprintItems: dto.mockExamBlueprintItems,
      })
      .catch((error: unknown) => {
        throw this.mapKnownError(error);
      });

    return ExamMutationResponseSchema.parse({
      exam: this.toResponse(exam, UserRole.ADMIN),
    });
  }

  async deleteExam(id: string): Promise<DeleteExamResponse> {
    const result = await this.examsRepository.deleteIfNoPapers(id);

    if (!result.exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    if (result.paperCount > 0) {
      throw new BadRequestException(
        '연결된 문제지가 있는 시험은 삭제할 수 없습니다.',
      );
    }

    return DeleteExamResponseSchema.parse({ id });
  }

  private toResponse(
    exam: ExamWithCategories,
    role: UserRole,
  ): ExamResponse | AdminExamResponse {
    const response = {
      id: exam.id,
      name: exam.name,
      slug: exam.slug,
      categories: exam.categories.map(({ category }) => ({
        id: category.id,
        name: category.name,
      })),
      usesMonth: exam.usesMonth,
      usesGrade: false,
      usesRound: exam.usesRound,
      isMockExamAvailable: this.isMockExamAvailable(exam),
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      paperCount: this.countPapers(exam),
      mockExamQuestionCount: exam.mockExamQuestionCount,
      eraTagGroupId: exam.eraTagGroupId,
      mockExamBlueprintItems: (exam.mockExamBlueprintItems ?? []).map(
        (item) => ({
          tagId: item.tagId,
          minQuestionCount: item.minQuestionCount,
          maxQuestionCount: item.maxQuestionCount,
          sortOrder: item.sortOrder,
        }),
      ),
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
    };
  }

  private assertNoMockExamSettingsOnCreate(dto: CreateExamDto) {
    if (
      dto.mockExamQuestionCount !== undefined ||
      dto.eraTagGroupId !== undefined ||
      dto.mockExamBlueprintItems !== undefined
    ) {
      throw new BadRequestException(
        '모의고사 설정은 시험 생성 후 수정 화면에서 저장해 주세요.',
      );
    }
  }

  private async assertMockExamSettings(
    existing: ExamWithCategories,
    dto: UpdateExamDto,
  ) {
    const shouldValidate =
      dto.mockExamQuestionCount !== undefined ||
      dto.eraTagGroupId !== undefined ||
      dto.mockExamBlueprintItems !== undefined;
    if (!shouldValidate) return;

    const questionCount =
      dto.mockExamQuestionCount === undefined
        ? existing.mockExamQuestionCount
        : dto.mockExamQuestionCount;
    const eraTagGroupId =
      dto.eraTagGroupId === undefined
        ? existing.eraTagGroupId
        : dto.eraTagGroupId;
    const blueprintItems =
      dto.mockExamBlueprintItems === undefined
        ? (existing.mockExamBlueprintItems ?? [])
        : dto.mockExamBlueprintItems;

    if (
      questionCount == null &&
      !eraTagGroupId &&
      blueprintItems.length === 0
    ) {
      return;
    }
    if (
      questionCount == null ||
      !eraTagGroupId ||
      blueprintItems.length === 0
    ) {
      throw new BadRequestException(
        '모의고사 총 문항수, 시대 태그 그룹, 출제 범위를 모두 입력해 주세요.',
      );
    }

    const tagGroupCount = await this.examsRepository.countTagGroupsByIds(
      [eraTagGroupId],
      existing.id,
    );
    if (tagGroupCount !== 1) {
      throw new BadRequestException(
        '선택한 시험에 속한 태그 그룹만 시대 태그 그룹으로 지정할 수 있습니다.',
      );
    }

    const tagIds = blueprintItems.map((item) => item.tagId);
    const uniqueTagIds = [...new Set(tagIds)];
    if (uniqueTagIds.length !== tagIds.length) {
      throw new BadRequestException('출제 범위 태그가 중복되었습니다.');
    }
    const tagCount = await this.examsRepository.countTagsByIdsInTagGroup(
      uniqueTagIds,
      existing.id,
      eraTagGroupId,
    );
    if (tagCount !== uniqueTagIds.length) {
      throw new BadRequestException(
        '시대 태그 그룹에 속한 태그만 출제 범위로 지정할 수 있습니다.',
      );
    }

    this.assertBlueprintQuestionCounts(questionCount, blueprintItems);
  }

  private assertBlueprintQuestionCounts(
    questionCount: number,
    blueprintItems: MockExamBlueprintItemInput[],
  ) {
    const sums = blueprintItems.reduce(
      (acc, item) => {
        if (item.minQuestionCount > item.maxQuestionCount) {
          throw new BadRequestException(
            '최소 문항수는 최대 문항수보다 클 수 없습니다.',
          );
        }
        return {
          min: acc.min + item.minQuestionCount,
          max: acc.max + item.maxQuestionCount,
        };
      },
      { min: 0, max: 0 },
    );
    if (sums.min > questionCount) {
      throw new BadRequestException(
        '출제 범위의 최소 문항수 합계가 총 문항수보다 큽니다.',
      );
    }
    if (sums.max < questionCount) {
      throw new BadRequestException(
        '출제 범위의 최대 문항수 합계가 총 문항수보다 작습니다.',
      );
    }
  }

  private isMockExamAvailable(exam: ExamWithCategories) {
    return (
      exam.mockExamQuestionCount != null &&
      !!exam.eraTagGroupId &&
      (exam.mockExamBlueprintItems?.length ?? 0) > 0
    );
  }

  private countPapers(exam: ExamWithCategories): number {
    return (
      exam.sessions?.reduce((sum, session) => sum + session._count.papers, 0) ??
      0
    );
  }

  private disableGradeClassification<T extends { usesGrade: boolean }>(
    exam: T | null,
  ): T | null {
    return exam ? { ...exam, usesGrade: false } : null;
  }

  private normalizeCategoryIds(categoryIds: string[]): string[] {
    return [...new Set(categoryIds)];
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return new BadRequestException('분류를 찾을 수 없습니다.');
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new BadRequestException('이미 사용 중인 시험 슬러그입니다.');
    }
    return error;
  }
}
