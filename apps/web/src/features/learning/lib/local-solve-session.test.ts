import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createLocalSolveSession,
  getLocalSolveSession,
  saveLocalSolveSessionAnswer,
  submitLocalSolveSession,
} from '@/features/learning/lib/local-solve-session';
import type { SolveSession } from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  clientApi: {
    get: vi.fn(),
  },
}));

const mockedClientApi = vi.mocked(clientApi);

function createLocalStorageStub() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

const baseSession = {
  id: 'server-session-1',
  mode: 'ONE_BY_ONE',
  paper: {
    id: 'paper-1',
    title: '기출 문제',
    year: 2026,
    month: 6,
    grade: null,
    round: null,
    questionCount: 3,
    isInLibrary: false,
    exam: { id: 'exam-1', name: '시험' },
    questions: [
      {
        id: 'question-1',
        questionRevisionId: 'revision-1',
        number: 1,
        type: 'MULTIPLE_CHOICE',
        imageUrl: 'https://example.com/question-1.png',
        imageCacheKey: 'question-1',
        choiceCount: 5,
        points: 10,
        recommendedTimeSeconds: null,
        isBookmarked: false,
        result: {
          gradingPolicy: 'EXACT',
          answerChoice: 2,
          answerText: null,
          explanation: '2번이 정답입니다.',
          isCorrect: null,
        },
      },
      {
        id: 'question-2',
        questionRevisionId: 'revision-2',
        number: 2,
        type: 'WRITTEN',
        imageUrl: 'https://example.com/question-2.png',
        imageCacheKey: 'question-2',
        choiceCount: null,
        points: 20,
        recommendedTimeSeconds: null,
        isBookmarked: false,
        result: {
          gradingPolicy: 'EXACT',
          answerChoice: null,
          answerText: '정답',
          explanation: null,
          isCorrect: null,
        },
      },
      {
        id: 'question-3',
        questionRevisionId: 'revision-3',
        number: 3,
        type: 'MULTIPLE_CHOICE',
        imageUrl: 'https://example.com/question-3.png',
        imageCacheKey: 'question-3',
        choiceCount: 5,
        points: 30,
        recommendedTimeSeconds: null,
        isBookmarked: false,
        result: {
          gradingPolicy: 'EXACT',
          answerChoice: 4,
          answerText: null,
          explanation: null,
          isCorrect: null,
        },
      },
    ],
  },
  answers: [],
  result: null,
  submittedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
} satisfies SolveSession;

beforeEach(() => {
  const localStorage = createLocalStorageStub();

  mockedClientApi.get.mockReset();
  mockedClientApi.get.mockResolvedValue({ session: baseSession });
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-07T00:00:00.000Z'));
  vi.stubGlobal('window', { localStorage });
  vi.stubGlobal('crypto', {
    randomUUID: () => 'local-id-1',
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('createLocalSolveSession', () => {
  it('서버 세션을 로컬 세션으로 초기화하고 정답 정보는 문항에서 숨긴다', async () => {
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'ONE_BY_ONE',
    });

    expect(mockedClientApi.get).toHaveBeenCalledWith(
      '/api/public/solve-sessions/papers/paper-1?mode=ONE_BY_ONE',
    );
    expect(session.id).toBe('local_local-id-1');
    expect(session.answers).toEqual([]);
    expect(session.paper.questions.map((question) => question.result)).toEqual([
      null,
      null,
      null,
    ]);
    expect(getLocalSolveSession(session.id)).toEqual(session);
  });
});

describe('saveLocalSolveSessionAnswer', () => {
  it('연습모드에서는 답안 저장 시 즉시 채점한다', async () => {
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'ONE_BY_ONE',
    });

    const response = saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: {
        answerChoice: 2,
        spentMilliseconds: 1500,
      },
    });

    expect(response.answer).toMatchObject({
      questionId: 'question-1',
      answerChoice: 2,
      answerText: null,
      isCorrect: true,
      spentMilliseconds: 1500,
    });
    expect(response.result).toMatchObject({
      answerChoice: 2,
      isCorrect: true,
    });
    expect(
      getLocalSolveSession(session.id)?.paper.questions[0].result,
    ).toMatchObject({
      answerChoice: 2,
      isCorrect: true,
    });
  });

  it('시험모드에서는 제출 전까지 문항 결과를 갱신하지 않는다', async () => {
    mockedClientApi.get.mockResolvedValue({
      session: { ...baseSession, mode: 'EXAM' },
    });
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'EXAM',
    });

    const response = saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: {
        answerChoice: 2,
      },
    });

    expect(response.result).toBeNull();
    expect(getLocalSolveSession(session.id)?.paper.questions[0].result).toBe(
      null,
    );
  });

  it('기존 풀이 시간에 새 풀이 시간을 누적한다', async () => {
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'ONE_BY_ONE',
    });

    saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: { answerChoice: 1, spentMilliseconds: 1000 },
    });
    const response = saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: { answerChoice: 2, spentMilliseconds: 2500 },
    });

    expect(response.answer.spentMilliseconds).toBe(3500);
    expect(response.answer.isCorrect).toBe(true);
  });

  it('모든 선택지가 정답인 객관식은 선택한 답안을 정답으로 채점한다', async () => {
    mockedClientApi.get.mockResolvedValue({
      session: {
        ...baseSession,
        paper: {
          ...baseSession.paper,
          questions: [
            {
              ...baseSession.paper.questions[0],
              result: {
                gradingPolicy: 'ANY_CHOICE',
                answerChoice: null,
                answerText: null,
                explanation: '모든 선택지를 정답으로 처리합니다.',
                isCorrect: null,
              },
            },
          ],
        },
      },
    });
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'ONE_BY_ONE',
    });

    const response = saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: { answerChoice: 5 },
    });

    expect(response.answer.isCorrect).toBe(true);
    expect(response.result).toMatchObject({
      gradingPolicy: 'ANY_CHOICE',
      answerChoice: null,
      isCorrect: true,
    });
  });
});

describe('submitLocalSolveSession', () => {
  it('제출 시 객관식/주관식 정답과 미응답을 집계한다', async () => {
    mockedClientApi.get.mockResolvedValue({
      session: { ...baseSession, mode: 'EXAM' },
    });
    const session = await createLocalSolveSession({
      paperId: 'paper-1',
      mode: 'EXAM',
    });

    saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-1',
      payload: { answerChoice: 2, spentMilliseconds: 1000 },
    });
    saveLocalSolveSessionAnswer({
      sessionId: session.id,
      questionId: 'question-2',
      payload: { answerText: ' 정답 ', spentMilliseconds: 2000 },
    });

    const submitted = submitLocalSolveSession(session.id);

    expect(submitted.result).toEqual({
      score: 30,
      totalCount: 3,
      answeredCount: 2,
      correctCount: 2,
      wrongCount: 1,
      totalSpentMilliseconds: 3000,
    });
    expect(
      submitted.paper.questions.map((question) => question.result),
    ).toEqual([
      {
        gradingPolicy: 'EXACT',
        answerChoice: 2,
        answerText: null,
        explanation: '2번이 정답입니다.',
        isCorrect: true,
      },
      {
        gradingPolicy: 'EXACT',
        answerChoice: null,
        answerText: '정답',
        explanation: null,
        isCorrect: true,
      },
      {
        gradingPolicy: 'EXACT',
        answerChoice: 4,
        answerText: null,
        explanation: null,
        isCorrect: false,
      },
    ]);
  });

  it('없는 세션이면 한국어 오류를 던진다', () => {
    expect(() => submitLocalSolveSession('missing')).toThrow(
      '풀이 세션을 찾을 수 없습니다.',
    );
  });
});
