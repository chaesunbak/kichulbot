import { ForbiddenException } from '@nestjs/common';
import {
  AnswerMode,
  Exam,
  Paper,
  Question,
  QuestionType,
  Subject,
} from '@prisma/client';
import { AnswerSessionsRepository } from './answer-sessions.repository';
import { AnswerSessionsService } from './answer-sessions.service';

const now = new Date('2026-05-31T00:00:00.000Z');
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
  recommendedTimeSeconds: 60,
  createdAt: now,
  updatedAt: now,
} satisfies Question;
const paper = {
  id: 'paper_1',
  title: '2025학년도 수능 한국사',
  year: 2025,
  questionCount: 20,
  isPublished: true,
  examId: 'exam_1',
  subjectId: 'subject_1',
  createdAt: now,
  updatedAt: now,
  exam: { id: 'exam_1', name: '수능', slug: 'suneung' } as Exam,
  subject: {
    id: 'subject_1',
    name: '한국사',
    slug: 'korean-history',
  } as Subject,
  questions: [question],
} satisfies Paper & { exam: Exam; subject: Subject; questions: Question[] };
const session = {
  id: 'session_1',
  userId: 'user_1',
  paperId: paper.id,
  submittedAt: null,
  mode: AnswerMode.EXAM,
  createdAt: now,
  updatedAt: now,
  paper,
  draftAnswers: [],
};

describe('AnswerSessionsService', () => {
  let service: AnswerSessionsService;
  let repository: jest.Mocked<AnswerSessionsRepository>;

  beforeEach(() => {
    repository = {
      findPublishedPaper: jest.fn(),
      start: jest.fn(),
      findById: jest.fn(),
      saveDraftAnswer: jest.fn(),
      submit: jest.fn(),
      findLogs: jest.fn(),
    } as unknown as jest.Mocked<AnswerSessionsRepository>;
    service = new AnswerSessionsService(repository);
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
    repository.saveDraftAnswer.mockResolvedValue({
      sessionId: session.id,
      questionId: question.id,
      answerChoice: 2,
      answerText: null,
      spentMilliseconds: 1200,
      createdAt: now,
      updatedAt: now,
    });

    const response = await service.saveDraftAnswer(
      'user_1',
      session.id,
      question.id,
      { answerChoice: 2 },
    );

    expect(response.draftAnswer.answerChoice).toBe(2);
    expect(
      (await service.get('user_1', session.id)).session.paper.questions[0],
    ).not.toHaveProperty('answerChoice');
  });

  it('reveals the answer immediately in one-by-one mode', async () => {
    repository.findById.mockResolvedValue({
      ...session,
      mode: AnswerMode.ONE_BY_ONE,
    });
    repository.saveDraftAnswer.mockResolvedValue({
      sessionId: session.id,
      questionId: question.id,
      answerChoice: 3,
      answerText: null,
      spentMilliseconds: 1000,
      createdAt: now,
      updatedAt: now,
    });

    const response = await service.saveDraftAnswer(
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
});
