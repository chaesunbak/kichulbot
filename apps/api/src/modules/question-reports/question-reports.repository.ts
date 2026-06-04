import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  Prisma,
  QuestionReportCategory,
  QuestionReportStatus,
} from '../../infrastructure/database/prisma-client';

type QuestionReportListFilters = {
  status?: QuestionReportStatus;
  category?: QuestionReportCategory;
  questionId?: string;
  page: number;
  limit: number;
};

@Injectable()
export class QuestionReportsRepository {
  constructor(private readonly db: DatabaseService) {}

  findPublishedQuestion(questionId: string) {
    return this.db.question.findFirst({
      where: { id: questionId, paper: { isPublished: true } },
      include: {
        revisions: {
          orderBy: { revision: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });
  }

  findQuestionRevision(questionId: string, questionRevisionId: string) {
    return this.db.questionRevision.findFirst({
      where: { id: questionRevisionId, questionId },
      select: { id: true },
    });
  }

  create(data: {
    reporterUserId: string | null;
    questionId: string;
    questionRevisionId?: string | null;
    category: QuestionReportCategory;
    content: string;
  }) {
    return this.db.questionReport.create({
      data,
      include: this.reportInclude(),
    });
  }

  async findMany(filters: QuestionReportListFilters) {
    const where: Prisma.QuestionReportWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.questionId ? { questionId: filters.questionId } : {}),
    };
    const skip = (filters.page - 1) * filters.limit;

    const [reports, total] = await this.db.$transaction([
      this.db.questionReport.findMany({
        where,
        include: this.reportInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.db.questionReport.count({ where }),
    ]);

    return { reports, total };
  }

  findById(id: string) {
    return this.db.questionReport.findUnique({
      where: { id },
      include: this.reportInclude(),
    });
  }

  update(
    id: string,
    data: {
      status?: QuestionReportStatus;
      adminMemo?: string | null;
      reviewedByUserId: string;
      reviewedAt: Date;
    },
  ) {
    return this.db.questionReport.update({
      where: { id },
      data,
      include: this.reportInclude(),
    });
  }

  private reportInclude() {
    return {
      question: {
        select: {
          id: true,
          paperId: true,
          number: true,
          paper: { select: { title: true } },
        },
      },
      reporter: {
        select: { id: true, email: true, nickname: true },
      },
      reviewedBy: {
        select: { id: true, email: true, nickname: true },
      },
    } satisfies Prisma.QuestionReportInclude;
  }
}
