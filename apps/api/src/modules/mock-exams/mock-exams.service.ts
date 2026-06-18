import type { StartMockExamSolveSessionResponse } from '@kichulbot/api-contract/mock-exams';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AnswerMode,
  Prisma,
} from '../../infrastructure/database/prisma-client';
import { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import { MockExamsRepository } from './mock-exams.repository';
import type {
  ConfiguredMockExam,
  MockExamBlueprintItem,
  MockExamCandidate,
  MockExamCandidateQuestion,
  MockExamGenerationPayload,
  MockExamSelection,
  MockExamSolveSessionPayload,
} from './mock-exams.types';

@Injectable()
export class MockExamsService {
  constructor(
    private readonly mockExamsRepository: MockExamsRepository,
    private readonly solveSessionsService: SolveSessionsService,
  ) {}

  async startSolveSession(
    userId: string,
    examId: string,
    mode: AnswerMode,
  ): Promise<StartMockExamSolveSessionResponse> {
    const { exam, blueprintItems, allocations, selections, generation } =
      await this.generate(examId);
    const questionSet = await this.mockExamsRepository.createQuestionSet({
      userId,
      title: `${exam.name} 모의고사`,
      questions: selections,
      parameters: this.toParameters(
        exam,
        blueprintItems,
        allocations,
        selections,
        generation,
      ),
    });
    const session = await this.solveSessionsService.startQuestionSet(
      userId,
      questionSet.id,
      mode,
      { reuseUnsubmitted: false },
    );
    return {
      ...session,
      generation,
    };
  }

  async startPublicSolveSession(
    examId: string,
    mode: AnswerMode,
  ): Promise<StartMockExamSolveSessionResponse> {
    const { exam, selections, generation } = await this.generate(examId);

    return {
      session: this.toPublicSessionPayload(exam, selections, mode),
      generation,
    };
  }

  private async generate(examId: string) {
    const exam = await this.mockExamsRepository.findExam(examId);
    if (!exam) throw new NotFoundException('시험을 찾을 수 없습니다.');
    this.assertConfigured(exam);

    const candidates = this.toCandidates(
      await this.mockExamsRepository.findPublishedQuestionCandidates(exam.id),
    );
    if (candidates.length < exam.mockExamQuestionCount) {
      throw new BadRequestException(
        '모의고사에 필요한 공개 문항이 부족합니다.',
      );
    }

    const blueprintItems = this.sortBlueprintItems(exam.mockExamBlueprintItems);
    const allocations = this.allocateQuestionCounts(
      exam.mockExamQuestionCount,
      blueprintItems,
    );
    const { selections, generation } = this.selectQuestions(
      candidates,
      blueprintItems,
      allocations,
      exam.mockExamQuestionCount,
    );
    return { exam, blueprintItems, allocations, selections, generation };
  }

  private assertConfigured(
    exam: ConfiguredMockExam,
  ): asserts exam is ConfiguredMockExam & { mockExamQuestionCount: number } {
    if (
      exam.mockExamQuestionCount == null ||
      !exam.eraTagGroupId ||
      exam.mockExamBlueprintItems.length === 0
    ) {
      throw new BadRequestException(
        '이 시험은 모의고사 생성 설정이 완료되지 않았습니다.',
      );
    }

    const sums = exam.mockExamBlueprintItems.reduce(
      (acc, item) => ({
        min: acc.min + item.minQuestionCount,
        max: acc.max + item.maxQuestionCount,
      }),
      { min: 0, max: 0 },
    );
    if (sums.min > exam.mockExamQuestionCount) {
      throw new BadRequestException(
        '모의고사 출제 범위의 최소 문항수 합계가 총 문항수보다 큽니다.',
      );
    }
    if (sums.max < exam.mockExamQuestionCount) {
      throw new BadRequestException(
        '모의고사 출제 범위의 최대 문항수 합계가 총 문항수보다 작습니다.',
      );
    }
  }

  private toCandidates(
    questions: MockExamCandidateQuestion[],
  ): MockExamCandidate[] {
    return questions
      .map((question) => {
        const revision = question.revisions[0];
        if (!revision) return null;
        return {
          questionId: question.id,
          revision,
          tagIds: new Set(question.tags.map((tag) => tag.tagId)),
        };
      })
      .filter(
        (candidate): candidate is MockExamCandidate => candidate !== null,
      );
  }

  private allocateQuestionCounts(
    totalCount: number,
    items: MockExamBlueprintItem[],
  ) {
    const allocations = new Map<string, number>();
    for (const item of items) {
      allocations.set(item.tagId, item.minQuestionCount);
    }

    let remaining =
      totalCount -
      items.reduce((total, item) => total + item.minQuestionCount, 0);
    while (remaining > 0) {
      const expandable = this.shuffle(
        items.filter(
          (item) => (allocations.get(item.tagId) ?? 0) < item.maxQuestionCount,
        ),
      );
      if (expandable.length === 0) break;
      for (const item of expandable) {
        if (remaining === 0) break;
        allocations.set(item.tagId, (allocations.get(item.tagId) ?? 0) + 1);
        remaining -= 1;
      }
    }

    return allocations;
  }

  private sortBlueprintItems(items: MockExamBlueprintItem[]) {
    return [...items].sort(
      (left, right) =>
        left.tag.sortOrder - right.tag.sortOrder ||
        left.tag.name.localeCompare(right.tag.name) ||
        left.sortOrder - right.sortOrder,
    );
  }

  private selectQuestions(
    candidates: MockExamCandidate[],
    items: MockExamBlueprintItem[],
    allocations: Map<string, number>,
    totalCount: number,
  ) {
    const selectedQuestionIds = new Set<string>();
    const selections: MockExamSelection[] = [];
    const insufficientTags: MockExamGenerationPayload['insufficientTags'] = [];

    for (const item of items) {
      const requiredCount = allocations.get(item.tagId) ?? 0;
      if (requiredCount === 0) continue;

      const tagCandidates = this.shuffle(
        candidates.filter(
          (candidate) =>
            candidate.tagIds.has(item.tagId) &&
            !selectedQuestionIds.has(candidate.questionId),
        ),
      );
      const selected = tagCandidates.slice(0, requiredCount);
      for (const candidate of selected) {
        selectedQuestionIds.add(candidate.questionId);
        selections.push({
          questionId: candidate.questionId,
          questionRevisionId: candidate.revision.id,
          revision: candidate.revision,
          selectedTagId: item.tagId,
          supplemented: false,
          reason: {
            generator: 'mock-exam-v1',
            tagId: item.tagId,
            tagName: item.tag.name,
            supplemented: false,
          },
        });
      }
      if (selected.length < requiredCount) {
        insufficientTags.push({
          tagId: item.tagId,
          tagName: item.tag.name,
          requiredCount,
          availableCount: tagCandidates.length,
          selectedCount: selected.length,
        });
      }
    }

    const supplementCount = totalCount - selections.length;
    if (supplementCount > 0) {
      const supplements = this.shuffle(
        candidates.filter(
          (candidate) => !selectedQuestionIds.has(candidate.questionId),
        ),
      ).slice(0, supplementCount);
      if (supplements.length < supplementCount) {
        throw new BadRequestException(
          '모의고사에 필요한 공개 문항이 부족합니다.',
        );
      }
      for (const candidate of supplements) {
        selectedQuestionIds.add(candidate.questionId);
        selections.push({
          questionId: candidate.questionId,
          questionRevisionId: candidate.revision.id,
          revision: candidate.revision,
          selectedTagId: null,
          supplemented: true,
          reason: {
            generator: 'mock-exam-v1',
            tagId: null,
            supplemented: true,
          },
        });
      }
    }

    return {
      selections,
      generation: {
        supplemented: insufficientTags.length > 0,
        insufficientTags,
      },
    };
  }

  private toPublicSessionPayload(
    exam: ConfiguredMockExam & { mockExamQuestionCount: number },
    selections: MockExamSelection[],
    mode: AnswerMode,
  ): MockExamSolveSessionPayload {
    const now = new Date();
    const nowIso = now.toISOString();
    return {
      id: `public_mock_exam_${exam.id}`,
      mode,
      paper: {
        id: `mock_exam_${exam.id}`,
        title: `${exam.name} 모의고사`,
        year: now.getUTCFullYear(),
        month: null,
        grade: null,
        round: null,
        questionCount: selections.length,
        isInLibrary: false,
        exam: {
          id: exam.id,
          name: exam.name,
        },
        questions: selections.map((selection, index) => ({
          id: selection.questionId,
          questionRevisionId: selection.questionRevisionId,
          number: index + 1,
          type: selection.revision.type,
          imageUrl: selection.revision.imageUrl,
          imageCacheKey: this.toImageCacheKey(selection.revision.imageHash),
          choiceCount: selection.revision.choiceCount,
          points: selection.revision.points,
          recommendedTimeSeconds: selection.revision.recommendedTimeSeconds,
          isBookmarked: false,
          result: {
            gradingPolicy: selection.revision.gradingPolicy,
            answerChoice: selection.revision.answerChoice,
            answerText: selection.revision.answerText,
            explanation: selection.revision.explanation,
            isCorrect: null,
          },
        })),
      },
      answers: [],
      result: null,
      submittedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  private toParameters(
    exam: ConfiguredMockExam & { mockExamQuestionCount: number },
    blueprintItems: MockExamBlueprintItem[],
    allocations: Map<string, number>,
    selections: MockExamSelection[],
    generation: MockExamGenerationPayload,
  ): Prisma.InputJsonValue {
    const selectedByTag = selections.reduce<Record<string, number>>(
      (acc, selection) => {
        const key = selection.selectedTagId ?? 'supplemented';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return {
      examId: exam.id,
      eraTagGroupId: exam.eraTagGroupId,
      questionCount: exam.mockExamQuestionCount,
      allocations: blueprintItems.map((item) => ({
        tagId: item.tagId,
        tagName: item.tag.name,
        tagSortOrder: item.tag.sortOrder,
        minQuestionCount: item.minQuestionCount,
        maxQuestionCount: item.maxQuestionCount,
        allocatedCount: allocations.get(item.tagId) ?? 0,
        selectedCount: selectedByTag[item.tagId] ?? 0,
      })),
      supplemented: generation.supplemented,
      insufficientTags: generation.insufficientTags,
      selectedByTag,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  private toImageCacheKey(imageHash: string): string {
    return imageHash.startsWith('legacy_') ? imageHash : `sha256_${imageHash}`;
  }
}
