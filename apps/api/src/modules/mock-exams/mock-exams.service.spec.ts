import { BadRequestException } from '@nestjs/common';

import { AnswerMode } from '../../infrastructure/database/prisma-client';
import type { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import type { MockExamsRepository } from './mock-exams.repository';
import { MockExamsService } from './mock-exams.service';

const now = new Date('2026-06-11T00:00:00.000Z');
const sessionResponse = {
  session: {
    id: 'session_1',
    mode: AnswerMode.EXAM,
    paper: {
      id: 'question_set_1',
      title: '수능 모의고사',
      year: 2026,
      month: null,
      grade: null,
      round: null,
      questionCount: 2,
      isInLibrary: false,
      exam: { id: 'exam_1', name: '수능' },
      questions: [],
    },
    answers: [],
    result: null,
    submittedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
};

describe('MockExamsService', () => {
  let service: MockExamsService;
  let repository: jest.Mocked<MockExamsRepository>;
  let solveSessionsService: jest.Mocked<SolveSessionsService>;

  beforeEach(() => {
    repository = {
      findExam: jest.fn(),
      findPublishedQuestionCandidates: jest.fn(),
      createQuestionSet: jest.fn().mockResolvedValue({ id: 'question_set_1' }),
    } as unknown as jest.Mocked<MockExamsRepository>;
    solveSessionsService = {
      startQuestionSet: jest.fn().mockResolvedValue(sessionResponse),
    } as unknown as jest.Mocked<SolveSessionsService>;
    service = new MockExamsService(repository, solveSessionsService);
  });

  it('설정된 시대 태그 범위에 맞춰 총 문항수를 정확히 생성한다', async () => {
    repository.findExam.mockResolvedValue(
      makeExam({
        mockExamBlueprintItems: [
          makeBlueprintItem('tag_1', '고대', 1, 1),
          makeBlueprintItem('tag_2', '근대', 1, 1),
        ],
      }) as never,
    );
    repository.findPublishedQuestionCandidates.mockResolvedValue([
      makeCandidate('question_1', 'revision_1', ['tag_1']),
      makeCandidate('question_2', 'revision_2', ['tag_2']),
      makeCandidate('question_3', 'revision_3', ['tag_2']),
    ] as never);

    await service.startSolveSession('user_1', 'exam_1', AnswerMode.EXAM);

    const createInput = repository.createQuestionSet.mock.calls[0][0];
    expect(createInput.questions).toHaveLength(2);
    expect(
      new Set(createInput.questions.map((item) => item.questionRevisionId))
        .size,
    ).toBe(2);
    expect(solveSessionsService.startQuestionSet).toHaveBeenCalledWith(
      'user_1',
      'question_set_1',
      AnswerMode.EXAM,
      { reuseUnsubmitted: false },
    );
  });

  it('시대 태그 문항이 부족하면 같은 시험의 다른 공개 문항으로 보충한다', async () => {
    repository.findExam.mockResolvedValue(
      makeExam({
        mockExamBlueprintItems: [makeBlueprintItem('tag_1', '고대', 2, 2)],
      }) as never,
    );
    repository.findPublishedQuestionCandidates.mockResolvedValue([
      makeCandidate('question_1', 'revision_1', ['tag_1']),
      makeCandidate('question_2', 'revision_2', []),
    ] as never);

    const response = await service.startSolveSession(
      'user_1',
      'exam_1',
      AnswerMode.EXAM,
    );

    expect(response.generation.supplemented).toBe(true);
    expect(response.generation.insufficientTags).toEqual([
      {
        tagId: 'tag_1',
        tagName: '고대',
        requiredCount: 2,
        availableCount: 1,
        selectedCount: 1,
      },
    ]);
    expect(
      repository.createQuestionSet.mock.calls[0][0].questions,
    ).toHaveLength(2);
  });

  it('태그 정렬 순서대로 모의고사 문항 위치를 생성한다', async () => {
    repository.findExam.mockResolvedValue(
      makeExam({
        mockExamBlueprintItems: [
          makeBlueprintItem('tag_2', '근대', 1, 1, 20),
          makeBlueprintItem('tag_1', '고대', 1, 1, 10),
        ],
      }) as never,
    );
    repository.findPublishedQuestionCandidates.mockResolvedValue([
      makeCandidate('question_2', 'revision_2', ['tag_2']),
      makeCandidate('question_1', 'revision_1', ['tag_1']),
    ] as never);

    await service.startSolveSession('user_1', 'exam_1', AnswerMode.EXAM);

    expect(
      repository.createQuestionSet.mock.calls[0][0].questions.map(
        (question) => question.questionRevisionId,
      ),
    ).toEqual(['revision_1', 'revision_2']);
  });

  it('모의고사 설정이 없으면 생성을 거부한다', async () => {
    repository.findExam.mockResolvedValue(
      makeExam({
        mockExamQuestionCount: null,
        eraTagGroupId: null,
        mockExamBlueprintItems: [],
      }) as never,
    );

    await expect(
      service.startSolveSession('user_1', 'exam_1', AnswerMode.EXAM),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createQuestionSet).not.toHaveBeenCalled();
  });
});

function makeExam(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exam_1',
    name: '수능',
    mockExamQuestionCount: 2,
    eraTagGroupId: 'tag_group_1',
    mockExamBlueprintItems: [],
    ...overrides,
  };
}

function makeBlueprintItem(
  tagId: string,
  tagName: string,
  minQuestionCount: number,
  maxQuestionCount: number,
  tagSortOrder = 0,
) {
  return {
    tagId,
    minQuestionCount,
    maxQuestionCount,
    sortOrder: 0,
    tag: { id: tagId, name: tagName, sortOrder: tagSortOrder },
  };
}

function makeCandidate(
  questionId: string,
  revisionId: string,
  tagIds: string[],
) {
  return {
    id: questionId,
    revisions: [{ id: revisionId }],
    tags: tagIds.map((tagId) => ({ tagId })),
  };
}
