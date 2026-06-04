import {
  AdminExamResponse,
  DeleteExamResponse,
  DeleteExamResponseSchema,
  ExamMutationResponse,
  ExamMutationResponseSchema,
  ExamResponse,
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
  Prisma,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamsRepository } from './exams.repository';

type ExamWithCategories = Exam & {
  categories: Array<ExamCategory & { category: Category }>;
  sessions?: Array<{ _count: { papers: number } }>;
};

@Injectable()
export class ExamsService {
  constructor(private readonly examsRepository: ExamsRepository) {}

  async listExams(role: UserRole): Promise<ListExamsResponse> {
    const exams = await this.examsRepository.findMany();
    return ListExamsResponseSchema.parse({
      exams: exams.map((exam) => this.toResponse(exam, role)),
    });
  }

  async findById(id: string) {
    const exam = await this.examsRepository.findById(id);
    return this.disableGradeClassification(exam);
  }

  async createExam(dto: CreateExamDto): Promise<ExamMutationResponse> {
    const categoryIds = this.normalizeCategoryIds(dto.categoryIds ?? []);
    const exam = await this.examsRepository
      .create({
        name: dto.name.trim(),
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
    const exam = await this.examsRepository
      .update(id, {
        name: dto.name?.trim(),
        categoryIds,
        usesMonth: dto.usesMonth,
        usesGrade: false,
        usesRound: dto.usesRound,
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
      categories: exam.categories.map(({ category }) => ({
        id: category.id,
        name: category.name,
      })),
      usesMonth: exam.usesMonth,
      usesGrade: false,
      usesRound: exam.usesRound,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      paperCount: this.countPapers(exam),
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
    };
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
    return error;
  }
}
