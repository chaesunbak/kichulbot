import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AnswerMode,
  AttemptOutcome,
  Exam,
  ExamSession,
  Paper,
  Question,
  QuestionSetKind,
  QuestionType,
} from '@prisma/client';

import {
  SolveSessionsRepository,
  SubmittedSolveSessionError,
} from './solve-sessions.repository';
import { SolveSessionsService } from './solve-sessions.service';

const now = new Date('2026-05-31T00:00:00.000Z');
const exam = {
  id: 'exam_1',
  name: '수능',
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
  createdAt: now,
  updatedAt: now,
} satisfies Exam;
const examSession = {
  id: 'exam_session_1',
  key: 'exam_1:2025:-:-:-',
  examId: exam.id,
  displayYear: 2025,
  month: null,
  grade: null,
  round: null,
  createdAt: now,
  updatedAt: now,
  exam,
} satisfies ExamSession & { exam: Exam };
const question = {
  id: 'question_1',
  paperId: 'paper_1',
  number: 1,
  type: QuestionType.MULTIPLE_CHOICE,
  imageUrl: 'http://localhost:4000/uploads/questions/question_1.png',
  choiceCount: 5,
  answerChoice: 3,
  answerText: null,
  explanation: '3번이 정답입니다.',
  points: 5,
  recommendedTimeSeconds: 60,
  createdAt: now,
  updatedAt: now,
} satisfies Question;
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  questionCount: 20,
  isPublished: true,
  examSessionId: examSession.id,
  questionSetId: 'question_set_1',
  createdAt: now,
  updatedAt: now,
  examSession,
} satisfies Paper & {
  examSession: ExamSession & { exam: Exam };
};
const questionRevision = {
  id: 'question_revision_1',
  questionId: question.id,
  revision: 1,
  type: question.type,
  imageUrl: question.imageUrl,
  choiceCount: question.choiceCount,
  answerChoice: question.answerChoice,
  answerText: question.answerText,
  explanation: question.explanation,
  points: question.points,
  recommendedTimeSeconds: question.recommendedTimeSeconds,
  createdAt: now,
  question,
};
const sessionItem = {
  id: 'session_item_1',
  sessionId: 'session_1',
  questionRevisionId: questionRevision.id,
  position: 1,
  createdAt: now,
  questionRevision,
  draft: null,
  attempts: [],
};
const session = {
  id: 'session_1',
  userId: 'user_1',
  paperId: paper.id,
  sourceSetId: paper.questionSetId,
  submittedAt: null,
  mode: AnswerMode.EXAM,
  createdAt: now,
  updatedAt: now,
  paper,
  sourceSet: {
    id: paper.questionSetId,
    kind: QuestionSetKind.OFFICIAL_PAPER,
    ownerUserId: null,
    title: paper.title,
    createdAt: now,
    updatedAt: now,
  },
  items: [sessionItem],
};
const correctDraft = {
  sessionItemId: sessionItem.id,
  answerChoice: 3,
  answerText: null,
  spentMilliseconds: 1000,
  updatedAt: now,
};
const correctAttempt = {
  id: 'attempt_1',
  userId: session.userId,
  sessionItemId: sessionItem.id,
  questionRevisionId: questionRevision.id,
  answerChoice: 3,
  answerText: null,
  outcome: AttemptOutcome.CORRECT,
  spentMilliseconds: 1000,
  gradedAt: now,
};
const omittedAttempt = {
  ...correctAttempt,
  id: 'attempt_omitted',
  answerChoice: null,
  outcome: AttemptOutcome.OMITTED,
  spentMilliseconds: 0,
};

describe('SolveSessionsService', () => {
  let service: SolveSessionsService;
  let repository: jest.Mocked<SolveSessionsRepository>;

  beforeEach(() => {
    repository = {
      findPublishedPaper: jest.fn(),
      start: jest.fn(),
      findById: jest.fn(),
      saveAnswer: jest.fn(),
      submit: jest.fn(),
      findLogs: jest.fn(),
    } as unknown as jest.Mocked<SolveSessionsRepository>;
    service = new SolveSessionsService(repository);
  });

  it('restores the existing session returned by the repository', async () => {
    repository.findPublishedPaper.mockResolvedValue(paper);
    repository.start.mockResolvedValue(session);

    const response = await service.start('user_1', paper.id, AnswerMode.EXAM);

    expect(repository.start).toHaveBeenCalledWith(
      'user_1',
      paper.id,
      AnswerMode.EXAM,
    );
    expect(response.session.id).toBe(session.id);
  });

  it('rejects access to a session owned by another user', async () => {
    repository.findById.mockResolvedValue(session);

    await expect(service.get('user_2', session.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('saves a selected choice without exposing the correct answer', async () => {
    repository.findById.mockResolvedValue(session);
    repository.saveAnswer.mockResolvedValue({
      draft: { ...correctDraft, answerChoice: 2, spentMilliseconds: 1200 },
      attempt: null,
    });

    const response = await service.saveAnswer(
      'user_1',
      session.id,
      question.id,
      { answerChoice: 2 },
    );

    expect(repository.saveAnswer).toHaveBeenCalledWith(
      session.id,
      sessionItem.id,
      { answerChoice: 2, answerText: null, spentMilliseconds: undefined },
    );
    expect(response.answer.answerChoice).toBe(2);
    expect(response.result).toBeNull();
    expect(
      (await service.get('user_1', session.id)).session.paper.questions[0],
    ).not.toHaveProperty('answerChoice');
  });

  it('reveals the immutable revision answer after a one-by-one attempt', async () => {
    repository.findById.mockResolvedValue({
      ...session,
      mode: AnswerMode.ONE_BY_ONE,
    });
    repository.saveAnswer.mockResolvedValue({
      draft: correctDraft,
      attempt: correctAttempt,
    });

    const response = await service.saveAnswer(
      'user_1',
      session.id,
      question.id,
      { answerChoice: 3, spentMilliseconds: 1000 },
    );

    expect(response.result).toMatchObject({
      answerChoice: 3,
      explanation: '3번이 정답입니다.',
      isCorrect: true,
    });
  });

  it('rejects a save when the session is submitted concurrently', async () => {
    repository.findById.mockResolvedValue(session);
    repository.saveAnswer.mockRejectedValue(new SubmittedSolveSessionError());

    await expect(
      service.saveAnswer('user_1', session.id, question.id, {
        answerChoice: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the confirmed score from the latest submitted attempt', async () => {
    repository.findById.mockResolvedValue(session);
    repository.submit.mockResolvedValue({
      ...session,
      submittedAt: now,
      items: [
        {
          ...sessionItem,
          draft: correctDraft,
          attempts: [correctAttempt],
        },
      ],
    });

    const response = await service.submit('user_1', session.id);

    expect(response.session.result).toMatchObject({
      score: 5,
      totalCount: 1,
      answeredCount: 1,
      correctCount: 1,
      wrongCount: 0,
    });
  });

  it('keeps daily wrong review sessions out of solve logs', async () => {
    repository.findLogs.mockResolvedValue([
      {
        ...session,
        sourceSet: {
          ...session.sourceSet,
          kind: QuestionSetKind.DAILY_WRONG,
        },
      },
      session,
    ]);

    const response = await service.listLogs('user_1');

    expect(response.logs).toHaveLength(1);
    expect(response.logs[0].id).toBe(session.id);
  });

  it('grades daily wrong review answers without a persisted attempt', async () => {
    repository.findById.mockResolvedValue({
      ...session,
      mode: AnswerMode.ONE_BY_ONE,
      paper: null,
      sourceSet: {
        id: 'daily_wrong_1',
        kind: QuestionSetKind.DAILY_WRONG,
        ownerUserId: session.userId,
        title: '2026년 6월 1일 오늘의 오답',
        createdAt: now,
        updatedAt: now,
      },
    });
    repository.saveAnswer.mockResolvedValue({
      draft: correctDraft,
      attempt: null,
    });

    const response = await service.saveAnswer(
      'user_1',
      session.id,
      question.id,
      { answerChoice: 3, spentMilliseconds: 1000 },
    );

    expect(response.answer.isCorrect).toBe(true);
    expect(response.result).toMatchObject({
      answerChoice: 3,
      isCorrect: true,
    });
  });

  it('counts an omitted submitted attempt as wrong but unanswered', async () => {
    repository.findById.mockResolvedValue(session);
    repository.submit.mockResolvedValue({
      ...session,
      submittedAt: now,
      items: [{ ...sessionItem, attempts: [omittedAttempt] }],
    });

    const response = await service.submit('user_1', session.id);

    expect(response.session.result).toMatchObject({
      score: 0,
      totalCount: 1,
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 1,
    });
  });

  it('calculates submitted daily wrong review results from drafts', async () => {
    repository.findById.mockResolvedValue({
      ...session,
      paper: null,
      sourceSet: {
        id: 'daily_wrong_1',
        kind: QuestionSetKind.DAILY_WRONG,
        ownerUserId: session.userId,
        title: '2026년 6월 1일 오늘의 오답',
        createdAt: now,
        updatedAt: now,
      },
    });
    repository.submit.mockResolvedValue({
      ...session,
      paper: null,
      sourceSet: {
        id: 'daily_wrong_1',
        kind: QuestionSetKind.DAILY_WRONG,
        ownerUserId: session.userId,
        title: '2026년 6월 1일 오늘의 오답',
        createdAt: now,
        updatedAt: now,
      },
      submittedAt: now,
      items: [{ ...sessionItem, draft: correctDraft, attempts: [] }],
    });

    const response = await service.submit('user_1', session.id);

    expect(response.session.result).toMatchObject({
      score: 5,
      totalCount: 1,
      answeredCount: 1,
      correctCount: 1,
      wrongCount: 0,
    });
  });

  it('lists only the current user logs', async () => {
    repository.findLogs.mockResolvedValue([]);

    await service.listLogs('user_1');

    expect(repository.findLogs).toHaveBeenCalledWith('user_1');
  });
});
