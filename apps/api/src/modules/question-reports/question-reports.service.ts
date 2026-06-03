import {
  ListAdminQuestionReportsResponse,
  ListAdminQuestionReportsResponseSchema,
  QuestionReportMutationResponse,
  QuestionReportMutationResponseSchema,
  QuestionReportResponse,
} from '@kichulbot/api-contract/question-reports';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateQuestionReportDto } from './dto/create-question-report.dto';
import { ListQuestionReportsDto } from './dto/list-question-reports.dto';
import { UpdateQuestionReportDto } from './dto/update-question-report.dto';
import { QuestionReportsRepository } from './question-reports.repository';

type StoredQuestionReport = NonNullable<
  Awaited<ReturnType<QuestionReportsRepository['findById']>>
>;

@Injectable()
export class QuestionReportsService {
  constructor(
    private readonly questionReportsRepository: QuestionReportsRepository,
  ) {}

  async create(
    reporterUserId: string | null,
    questionId: string,
    dto: CreateQuestionReportDto,
  ): Promise<QuestionReportMutationResponse> {
    const question =
      await this.questionReportsRepository.findPublishedQuestion(questionId);
    if (!question) {
      throw new NotFoundException('문항을 찾을 수 없습니다.');
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('신고 내용을 입력해주세요.');
    }

    const questionRevisionId =
      dto.questionRevisionId ?? question.revisions[0]?.id ?? null;
    if (questionRevisionId) {
      const revision =
        await this.questionReportsRepository.findQuestionRevision(
          questionId,
          questionRevisionId,
        );
      if (!revision) {
        throw new BadRequestException(
          '문항 리비전이 문항과 일치하지 않습니다.',
        );
      }
    }

    const report = await this.questionReportsRepository.create({
      reporterUserId,
      questionId,
      questionRevisionId,
      category: dto.category,
      content,
    });

    return QuestionReportMutationResponseSchema.parse({
      report: this.toResponse(report),
    });
  }

  async listAdmin(
    query: ListQuestionReportsDto,
  ): Promise<ListAdminQuestionReportsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { reports, total } = await this.questionReportsRepository.findMany({
      status: query.status,
      category: query.category,
      questionId: query.questionId?.trim() || undefined,
      page,
      limit,
    });

    return ListAdminQuestionReportsResponseSchema.parse({
      items: reports.map((report) => this.toResponse(report)),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  }

  async updateAdmin(
    reportId: string,
    reviewerUserId: string,
    dto: UpdateQuestionReportDto,
  ): Promise<QuestionReportMutationResponse> {
    const hasStatus = dto.status !== undefined;
    const hasAdminMemo = dto.adminMemo !== undefined;
    if (!hasStatus && !hasAdminMemo) {
      throw new BadRequestException('변경할 신고 처리 값을 입력해주세요.');
    }

    const report = await this.questionReportsRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException('문항 신고를 찾을 수 없습니다.');
    }

    const updated = await this.questionReportsRepository.update(reportId, {
      ...(hasStatus ? { status: dto.status } : {}),
      ...(hasAdminMemo
        ? { adminMemo: this.normalizeAdminMemo(dto.adminMemo) }
        : {}),
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    });

    return QuestionReportMutationResponseSchema.parse({
      report: this.toResponse(updated),
    });
  }

  private normalizeAdminMemo(adminMemo: string | null | undefined) {
    if (adminMemo === null || adminMemo === undefined) return null;
    const trimmed = adminMemo.trim();
    return trimmed || null;
  }

  private toResponse(report: StoredQuestionReport): QuestionReportResponse {
    return {
      id: report.id,
      reporterUserId: report.reporterUserId,
      questionId: report.questionId,
      questionRevisionId: report.questionRevisionId,
      category: report.category,
      content: report.content,
      status: report.status,
      adminMemo: report.adminMemo,
      reviewedByUserId: report.reviewedByUserId,
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      question: {
        id: report.question.id,
        paperId: report.question.paperId,
        paperTitle: report.question.paper.title,
        number: report.question.number,
      },
      reporter: report.reporter,
      reviewedBy: report.reviewedBy,
    };
  }
}
