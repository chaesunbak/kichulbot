import {
  AdminPaperResponse,
  CreatePaperResponse,
  CreatePaperResponseSchema,
  GetPaperResponse,
  GetPaperResponseSchema,
  ListPapersResponse,
  ListPapersResponseSchema,
  PaperResponse,
} from '@kichulbot/api-contract/papers';
import { TaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Exam, Paper, Question, Subject, UserRole } from '@prisma/client';
import { ExamsService } from '../exams/exams.service';
import { SubjectsService } from '../subjects/subjects.service';
import { CreatePaperDto } from './dto/create-paper.dto';
import { PapersRepository } from './papers.repository';

type PaperWithRelations = Paper & {
  exam: Exam;
  subject: Subject;
  questions?: Question[];
};

@Injectable()
export class PapersService {
  constructor(
    private readonly papersRepository: PapersRepository,
    private readonly examsService: ExamsService,
    private readonly subjectsService: SubjectsService,
  ) {}

  async createPaper(
    dto: CreatePaperDto,
    role: UserRole,
  ): Promise<CreatePaperResponse> {
    const [exam, subject] = await Promise.all([
      this.examsService.findById(dto.examId),
      this.subjectsService.findById(dto.subjectId),
    ]);

    if (!exam) {
      throw new BadRequestException('시험을 찾을 수 없습니다.');
    }

    if (!subject) {
      throw new BadRequestException('과목을 찾을 수 없습니다.');
    }

    const paper = await this.papersRepository.create({
      title: dto.title,
      year: dto.year,
      examId: dto.examId,
      subjectId: dto.subjectId,
      questionCount: dto.questionCount ?? 20,
      isPublished: dto.isPublished ?? false,
    });

    return CreatePaperResponseSchema.parse({
      paper: this.toPaperResponse(paper, role),
    });
  }

  async listPapers(role: UserRole): Promise<ListPapersResponse> {
    const papers = await this.papersRepository.findMany(
      role === UserRole.ADMIN ? {} : { isPublished: true },
    );

    return ListPapersResponseSchema.parse({
      papers: papers.map((paper) => this.toPaperResponse(paper, role)),
    });
  }

  async getPaper(id: string, role: UserRole): Promise<GetPaperResponse> {
    const paper = await this.papersRepository.findById(
      id,
      role === UserRole.ADMIN ? {} : { isPublished: true },
    );

    if (!paper) {
      throw new NotFoundException('문제지를 찾을 수 없습니다.');
    }

    return GetPaperResponseSchema.parse({
      paper: this.toPaperResponse(paper, role),
    });
  }

  private toPaperResponse(
    paper: PaperWithRelations,
    role: UserRole,
  ): PaperResponse | AdminPaperResponse {
    const base = {
      id: paper.id,
      title: paper.title,
      year: paper.year,
      questionCount: paper.questionCount,
      exam: this.toTaxonomyResponse(paper.exam),
      subject: this.toTaxonomyResponse(paper.subject),
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
        imageUrl: question.imageUrl,
        choiceCount: question.choiceCount,
        answer: question.answer,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
      })),
    };
  }

  private toTaxonomyResponse(entity: Exam | Subject): TaxonomyResponse {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
    };
  }
}
