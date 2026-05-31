import {
  AdminPaperResponse,
  CreatePaperResponse,
  CreatePaperResponseSchema,
  DeletePaperResponse,
  DeletePaperResponseSchema,
  GetPaperResponse,
  GetPaperResponseSchema,
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
  Paper,
  Prisma,
  Question,
  Subject,
  UserRole,
} from '@prisma/client';
import { ExamsService } from '../exams/exams.service';
import { SubjectsService } from '../subjects/subjects.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CreatePaperDto } from './dto/create-paper.dto';
import { UpdatePaperDto } from './dto/update-paper.dto';
import { PapersRepository } from './papers.repository';

type PaperWithRelations = Paper & {
  exam: Exam;
  subject: Subject;
  questions?: Array<
    Question & {
      tags?: Array<
        Prisma.QuestionTagGetPayload<{
          include: { tag: true };
        }>
      >;
    }
  >;
};

@Injectable()
export class PapersService {
  constructor(
    private readonly papersRepository: PapersRepository,
    private readonly examsService: ExamsService,
    private readonly subjectsService: SubjectsService,
    private readonly storageService: StorageService,
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
        type: question.type,
        imageUrl: question.imageUrl,
        choiceCount: question.choiceCount,
        answerChoice: question.answerChoice,
        answerText: question.answerText,
        tags:
          question.tags?.map((questionTag) => ({
            id: questionTag.tag.id,
            name: questionTag.tag.name,
            slug: questionTag.tag.slug,
            kind: 'OFFICIAL',
            isActive: questionTag.tag.isActive,
          })) ?? [],
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

  private async deleteStoredImage(imageUrl: string | null): Promise<void> {
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
