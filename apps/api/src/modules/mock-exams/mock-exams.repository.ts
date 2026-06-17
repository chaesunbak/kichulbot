import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  Prisma,
  QuestionSetKind,
} from '../../infrastructure/database/prisma-client';

export type MockExamSelectedQuestion = {
  questionRevisionId: string;
  reason: Prisma.InputJsonValue;
};

@Injectable()
export class MockExamsRepository {
  constructor(private readonly db: DatabaseService) {}

  findExam(examId: string) {
    return this.db.exam.findUnique({
      where: { id: examId },
      include: {
        eraTagGroup: true,
        mockExamBlueprintItems: {
          include: { tag: true },
          orderBy: [
            { tag: { sortOrder: 'asc' } },
            { tag: { name: 'asc' } },
            { sortOrder: 'asc' },
          ],
        },
      },
    });
  }

  findPublishedQuestionCandidates(examId: string) {
    return this.db.question.findMany({
      where: {
        paper: {
          isPublished: true,
          examSession: { examId },
        },
      },
      include: {
        revisions: {
          orderBy: { revision: 'desc' },
          take: 1,
          select: {
            id: true,
            questionId: true,
            type: true,
            imageUrl: true,
            imageHash: true,
            choiceCount: true,
            gradingPolicy: true,
            answerChoice: true,
            answerText: true,
            explanation: true,
            points: true,
            recommendedTimeSeconds: true,
          },
        },
        tags: true,
      },
      orderBy: [{ paperId: 'asc' }, { number: 'asc' }],
    });
  }

  createQuestionSet(input: {
    userId: string;
    title: string;
    questions: MockExamSelectedQuestion[];
    parameters: Prisma.InputJsonValue;
  }) {
    return this.db.questionSet.create({
      data: {
        ownerUserId: input.userId,
        kind: QuestionSetKind.RECOMMENDED,
        title: input.title,
        generated: {
          create: {
            ownerUserId: input.userId,
            kind: QuestionSetKind.RECOMMENDED,
            generatorVersion: 'mock-exam-v1',
            parameters: input.parameters,
          },
        },
        items: {
          create: input.questions.map((question, index) => ({
            questionRevisionId: question.questionRevisionId,
            position: index + 1,
            reason: question.reason,
          })),
        },
      },
    });
  }
}
