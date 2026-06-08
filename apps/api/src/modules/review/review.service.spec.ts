import { BadRequestException } from '@nestjs/common';

import {
  AnswerMode,
  AttemptOutcome,
  QuestionSetKind,
} from '../../infrastructure/database/prisma-client';
import type { SolveSessionsService } from '../solve-sessions/solve-sessions.service';
import type { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

const now = new Date('2026-06-01T00:00:00.000Z');
const questionSet = {
  id: 'daily_wrong_1',
  kind: QuestionSetKind.DAILY_WRONG,
  ownerUserId: 'user_1',
  title: '2026년 6월 1일 오늘의 오답',
  createdAt: now,
  updatedAt: now,
  generated: {
    questionSetId: 'daily_wrong_1',
    ownerUserId: 'user_1',
    kind: QuestionSetKind.DAILY_WRONG,
    studyDate: now,
    generatorVersion: 'daily-wrong-v1',
    parameters: null,
    generatedAt: now,
    expiresAt: null,
  },
  items: [
    {
      questionSetId: 'daily_wrong_1',
      questionRevisionId: 'revision_1',
      position: 1,
      sourceAttemptId: 'attempt_1',
      reason: { sourceOutcome: AttemptOutcome.OMITTED },
      createdAt: now,
      sourceAttempt: {
        id: 'attempt_1',
        userId: 'user_1',
        sessionItemId: 'item_1',
        questionRevisionId: 'revision_1',
        answerChoice: null,
        answerText: null,
        outcome: AttemptOutcome.OMITTED,
        spentMilliseconds: 0,
        gradedAt: now,
      },
      questionRevision: {
        id: 'revision_1',
        questionId: 'question_1',
        revision: 1,
        type: 'MULTIPLE_CHOICE',
        imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
        imageHash: 'legacy_question_1',
        choiceCount: 5,
        answerChoice: 3,
        answerText: null,
        explanation: null,
        recommendedTimeSeconds: null,
        createdAt: now,
        question: {
          id: 'question_1',
          paperId: 'paper_1',
          number: 1,
          type: 'MULTIPLE_CHOICE',
          imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
          imageHash: 'legacy_question_1',
          choiceCount: 5,
          answerChoice: 3,
          answerText: null,
          explanation: null,
          recommendedTimeSeconds: null,
          createdAt: now,
          updatedAt: now,
          paper: {
            id: 'paper_1',
            title: '2025학년도 수능 한국사',
            questionCount: 20,
            isPublished: true,
            examSessionId: 'exam_session_1',
            questionSetId: 'official_set_1',
            createdAt: now,
            updatedAt: now,
            examSession: {
              id: 'exam_session_1',
              key: 'exam_1:2025:-:-:-',
              examId: 'exam_1',
              displayYear: 2025,
              month: null,
              grade: null,
              round: null,
              createdAt: now,
              updatedAt: now,
              exam: {
                id: 'exam_1',
                name: '수능',
                slug: 'korean-history',
                usesMonth: false,
                usesGrade: false,
                usesRound: false,
                createdAt: now,
                updatedAt: now,
              },
            },
          },
        },
      },
    },
  ],
};

describe('ReviewService', () => {
  let service: ReviewService;
  let repository: jest.Mocked<ReviewRepository>;
  let solveSessionsService: jest.Mocked<SolveSessionsService>;

  beforeEach(() => {
    repository = {
      findUser: jest.fn().mockResolvedValue({
        id: 'user_1',
        timezone: 'Asia/Seoul',
      }),
      findByStudyDate: jest.fn(),
      findOwnedDailyWrongQuestionSet: jest.fn(),
      generate: jest.fn(),
      regenerate: jest.fn(),
    } as unknown as jest.Mocked<ReviewRepository>;
    solveSessionsService = {
      startQuestionSet: jest.fn(),
    } as unknown as jest.Mocked<SolveSessionsService>;
    service = new ReviewService(repository, solveSessionsService);
  });

  it('고정된 오늘의 오답 세트에서 누락 문항을 반환한다', async () => {
    repository.findByStudyDate.mockResolvedValue(questionSet as never);

    const response = await service.getByStudyDate('user_1', '2026-06-01');

    expect(response.questionSet?.questions[0]).toMatchObject({
      id: 'question_1',
      sourceOutcome: 'OMITTED',
      paper: { title: '2025학년도 수능 한국사' },
    });
    expect(repository.findByStudyDate).toHaveBeenCalledWith(
      'user_1',
      expect.any(Date),
    );
  });

  it('요청한 학습일 기준으로 오답 세트를 생성한다', async () => {
    repository.regenerate.mockResolvedValue(questionSet as never);

    const response = await service.generate('user_1', '2026-06-01');

    expect(response.questionSet.id).toBe(questionSet.id);
    expect(repository.regenerate).toHaveBeenCalledWith(
      'user_1',
      expect.any(Date),
    );
  });

  it('기본값으로 한 문제씩 스냅샷 세션을 시작한다', async () => {
    repository.findOwnedDailyWrongQuestionSet.mockResolvedValue(
      questionSet as never,
    );
    solveSessionsService.startQuestionSet.mockResolvedValue({
      session: { id: 'review_session_1' },
    } as never);

    await service.start('user_1', questionSet.id);

    expect(solveSessionsService.startQuestionSet).toHaveBeenCalledWith(
      'user_1',
      questionSet.id,
      AnswerMode.ONE_BY_ONE,
    );
  });

  it('최신 오답 세트를 갱신하고 새 스냅샷 세션을 시작한다', async () => {
    repository.regenerate.mockResolvedValue(questionSet as never);
    solveSessionsService.startQuestionSet.mockResolvedValue({
      session: { id: 'review_session_1' },
    } as never);

    await service.startLatest('user_1');

    expect(repository.regenerate).toHaveBeenCalledWith(
      'user_1',
      expect.any(Date),
    );
    expect(solveSessionsService.startQuestionSet).toHaveBeenCalledWith(
      'user_1',
      questionSet.id,
      AnswerMode.ONE_BY_ONE,
      { reuseUnsubmitted: false },
    );
  });

  it('오답 문항이 없으면 리뷰 시작을 거부한다', async () => {
    repository.findOwnedDailyWrongQuestionSet.mockResolvedValue({
      ...questionSet,
      items: [],
    });

    await expect(
      service.start('user_1', questionSet.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('최신 오답 문항이 없으면 리뷰 시작을 거부한다', async () => {
    repository.regenerate.mockResolvedValue({
      ...questionSet,
      items: [],
    });

    await expect(service.startLatest('user_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
