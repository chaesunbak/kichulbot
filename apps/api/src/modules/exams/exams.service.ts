import {
  AdminExamResponse,
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
import { Category, Exam, ExamCategory, Prisma, UserRole } from '@prisma/client';

import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamsRepository } from './exams.repository';

type ExamWithCategories = Exam & {
  categories: Array<ExamCategory & { category: Category }>;
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

  findById(id: string) {
    return this.examsRepository.findById(id);
  }

  async createExam(dto: CreateExamDto): Promise<ExamMutationResponse> {
    const categoryIds = this.normalizeCategoryIds(dto.categoryIds);
    const exam = await this.examsRepository
      .create({
        name: dto.name.trim(),
        categoryIds,
        usesMonth: dto.usesMonth ?? false,
        usesGrade: dto.usesGrade ?? false,
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

    const categoryIds = dto.categoryIds
      ? this.normalizeCategoryIds(dto.categoryIds)
      : undefined;
    const exam = await this.examsRepository
      .update(id, {
        name: dto.name?.trim(),
        categoryIds,
        usesMonth: dto.usesMonth,
        usesGrade: dto.usesGrade,
        usesRound: dto.usesRound,
      })
      .catch((error: unknown) => {
        throw this.mapKnownError(error);
      });

    return ExamMutationResponseSchema.parse({
      exam: this.toResponse(exam, UserRole.ADMIN),
    });
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
      usesGrade: exam.usesGrade,
      usesRound: exam.usesRound,
    };

    if (role !== UserRole.ADMIN) {
      return response;
    }

    return {
      ...response,
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
    };
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
