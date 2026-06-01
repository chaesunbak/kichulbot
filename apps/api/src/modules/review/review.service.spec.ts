import { BadRequestException } from '@nestjs/common';
import { AnswerMode, AttemptOutcome, QuestionSetKind } from '@prisma/client';
import { AnswerSessionsService } from '../answer-sessions/answer-sessions.service';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

const now = new Date('2026-06-01T00:00:00.000Z');
const questionSet = {
  id: 'daily_wrong_1',
  kind: QuestionSetKind.DAILY_WRONG,
  ownerUserId: 'user_1',
  title: '2026-06-01 오늘의 오답',
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
        imageUrl: null,
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
          imageUrl: null,
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
            subjectId: 'subject_1',
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
                slug: 'suneung',
                usesMonth: false,
                usesGrade: false,
                usesRound: false,
                createdAt: now,
                updatedAt: now,
              },
            },
            subject: {
              id: 'subject_1',
              name: '한국사',
              slug: 'korean-history',
              createdAt: now,
              updatedAt: now,
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
  let answerSessionsService: jest.Mocked<AnswerSessionsService>;

  beforeEach(() => {
    repository = {
      findUser: jest.fn().mockResolvedValue({
        id: 'user_1',
        timezone: 'Asia/Seoul',
      }),
      findOrCreateToday: jest.fn(),
      refreshToday: jest.fn(),
    } as unknown as jest.Mocked<ReviewRepository>;
    answerSessionsService = {
      startQuestionSet: jest.fn(),
    } as unknown as jest.Mocked<AnswerSessionsService>;
    service = new ReviewService(repository, answerSessionsService);
  });

  it('returns omitted questions from the stable daily wrong set', async () => {
    repository.findOrCreateToday.mockResolvedValue(questionSet as never);

    const response = await service.getToday('user_1');

    expect(response.questionSet.questions[0]).toMatchObject({
      id: 'question_1',
      sourceOutcome: 'OMITTED',
      paper: { title: '2025학년도 수능 한국사' },
    });
    expect(repository.findOrCreateToday).toHaveBeenCalledWith(
      'user_1',
      expect.any(Date),
    );
  });

  it('starts a one-by-one snapshot session by default', async () => {
    repository.findOrCreateToday.mockResolvedValue(questionSet as never);
    answerSessionsService.startQuestionSet.mockResolvedValue({
      session: { id: 'review_session_1' },
    } as never);

    await service.startToday('user_1');

    expect(answerSessionsService.startQuestionSet).toHaveBeenCalledWith(
      'user_1',
      questionSet.id,
      AnswerMode.ONE_BY_ONE,
    );
  });

  it('rejects starting a review when there are no wrong questions', async () => {
    repository.findOrCreateToday.mockResolvedValue({
      ...questionSet,
      items: [],
    });

    await expect(service.startToday('user_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
