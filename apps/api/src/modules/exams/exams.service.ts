import {
  AdminExamResponse,
  ExamResponse,
  ListExamsResponse,
  ListExamsResponseSchema,
} from '@kichulbot/api-contract/taxonomy';
import { Injectable } from '@nestjs/common';
import { Exam, UserRole } from '@prisma/client';
import { ExamsRepository } from './exams.repository';

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

  private toResponse(
    exam: Exam,
    role: UserRole,
  ): ExamResponse | AdminExamResponse {
    const response = {
      id: exam.id,
      name: exam.name,
      slug: exam.slug,
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
}
