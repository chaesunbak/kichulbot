import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import type { Prisma } from '../../infrastructure/database/prisma-client';
import type { PublicExamPaperOverviewRow } from './exams.types';

interface ExamCreateData {
  name: string;
  slug: string;
  categoryIds: string[];
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
  mockExamQuestionCount?: number | null;
  eraTagGroupId?: string | null;
  mockExamBlueprintItems?: MockExamBlueprintItemInput[];
}

interface ExamUpdateData {
  name?: string;
  slug?: string;
  categoryIds?: string[];
  usesMonth?: boolean;
  usesGrade?: boolean;
  usesRound?: boolean;
  mockExamQuestionCount?: number | null;
  eraTagGroupId?: string | null;
  mockExamBlueprintItems?: MockExamBlueprintItemInput[];
}

interface MockExamBlueprintItemInput {
  tagId: string;
  minQuestionCount: number;
  maxQuestionCount: number;
  sortOrder?: number;
}

const examInclude = {
  categories: { include: { category: true } },
  mockExamBlueprintItems: { orderBy: { sortOrder: 'asc' as const } },
  sessions: {
    select: {
      _count: {
        select: { papers: true },
      },
    },
  },
} satisfies Prisma.ExamInclude;

@Injectable()
export class ExamsRepository {
  constructor(private readonly db: DatabaseService) {}

  findMany() {
    return this.db.exam.findMany({
      include: examInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findManyPublicPaperOverviews(
    paperLimit: number,
  ): Promise<PublicExamPaperOverviewRow[]> {
    const exams = await this.db.exam.findMany({
      include: {
        categories: { include: { category: true } },
        mockExamBlueprintItems: {
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      exams.map(async (exam) => {
        const paperWhere = {
          isPublished: true,
          examSession: { examId: exam.id },
        } satisfies Prisma.PaperWhereInput;
        const [paperCount, papers] = await Promise.all([
          this.db.paper.count({ where: paperWhere }),
          this.db.paper.findMany({
            where: paperWhere,
            select: {
              id: true,
              title: true,
              questionCount: true,
              examSession: {
                select: {
                  displayYear: true,
                  month: true,
                  grade: true,
                  round: true,
                },
              },
              _count: { select: { questions: true } },
            },
            orderBy: [
              { examSession: { displayYear: 'desc' } },
              { examSession: { month: 'desc' } },
              { examSession: { round: 'desc' } },
              { createdAt: 'desc' },
            ],
            take: paperLimit,
          }),
        ]);

        return {
          id: exam.id,
          name: exam.name,
          slug: exam.slug,
          categories: exam.categories
            .map(({ category }) => ({ id: category.id, name: category.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
          usesMonth: exam.usesMonth,
          usesGrade: exam.usesGrade,
          usesRound: exam.usesRound,
          isMockExamAvailable:
            exam.mockExamQuestionCount != null &&
            !!exam.eraTagGroupId &&
            exam.mockExamBlueprintItems.length > 0,
          paperCount,
          papers: papers.map((paper) => ({
            id: paper.id,
            title: paper.title,
            year: paper.examSession.displayYear,
            month: paper.examSession.month,
            grade: paper.examSession.grade,
            round: paper.examSession.round,
            questionCount: paper.questionCount,
            registeredQuestionCount: paper._count.questions,
          })),
        };
      }),
    );
  }

  findById(id: string) {
    return this.db.exam.findUnique({
      where: { id },
      include: examInclude,
    });
  }

  create(data: ExamCreateData) {
    return this.db.exam.create({
      data: {
        name: data.name,
        slug: data.slug,
        usesMonth: data.usesMonth,
        usesGrade: data.usesGrade,
        usesRound: data.usesRound,
        mockExamQuestionCount: data.mockExamQuestionCount,
        eraTagGroupId: data.eraTagGroupId,
        mockExamBlueprintItems: data.mockExamBlueprintItems
          ? {
              create: data.mockExamBlueprintItems.map((item, index) => ({
                tagId: item.tagId,
                minQuestionCount: item.minQuestionCount,
                maxQuestionCount: item.maxQuestionCount,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
        categories: {
          create: data.categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      },
      include: examInclude,
    });
  }

  update(id: string, data: ExamUpdateData) {
    return this.db.exam.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        usesMonth: data.usesMonth,
        usesGrade: data.usesGrade,
        usesRound: data.usesRound,
        mockExamQuestionCount: data.mockExamQuestionCount,
        eraTagGroupId: data.eraTagGroupId,
        ...(data.mockExamBlueprintItems
          ? {
              mockExamBlueprintItems: {
                deleteMany: {},
                create: data.mockExamBlueprintItems.map((item, index) => ({
                  tagId: item.tagId,
                  minQuestionCount: item.minQuestionCount,
                  maxQuestionCount: item.maxQuestionCount,
                  sortOrder: item.sortOrder ?? index,
                })),
              },
            }
          : {}),
        ...(data.categoryIds
          ? {
              categories: {
                deleteMany: {},
                create: data.categoryIds.map((categoryId) => ({
                  category: { connect: { id: categoryId } },
                })),
              },
            }
          : {}),
      },
      include: examInclude,
    });
  }

  async deleteIfNoPapers(id: string) {
    return this.db.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({
        where: { id },
        include: examInclude,
      });

      if (!exam) {
        return { exam: null, paperCount: 0 };
      }

      const paperCount = exam.sessions.reduce(
        (sum, session) => sum + session._count.papers,
        0,
      );

      if (paperCount > 0) {
        return { exam, paperCount };
      }

      await tx.examSession.deleteMany({ where: { examId: id } });
      await tx.exam.delete({ where: { id } });

      return { exam, paperCount };
    });
  }

  countTagGroupsByIds(tagGroupIds: string[], examId: string) {
    return this.db.tagGroup.count({
      where: { id: { in: tagGroupIds }, examId },
    });
  }

  countTagsByIdsInTagGroup(
    tagIds: string[],
    examId: string,
    tagGroupId: string,
  ) {
    return this.db.tag.count({
      where: {
        id: { in: tagIds },
        examId,
        tagGroupId,
      },
    });
  }
}
