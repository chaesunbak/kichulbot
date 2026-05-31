import { cache } from 'react';
import { api } from './api';
import { getToken } from './auth';
import type { Paper } from './papers';

export interface LibraryPaper {
  paper: Paper;
  createdAt: string;
}

export interface Bookshelf {
  id: string;
  name: string;
  papers: LibraryPaper[];
  createdAt: string;
  updatedAt: string;
}

export interface SolveQuestion {
  id: string;
  number: number;
  type: 'MULTIPLE_CHOICE' | 'WRITTEN';
  imageUrl: string | null;
  choiceCount: number | null;
  recommendedTimeSeconds: number | null;
  result: QuestionResult | null;
}

export interface QuestionResult {
  answerChoice: number | null;
  answerText: string | null;
  explanation: string | null;
  isCorrect: boolean | null;
}

export interface DraftAnswer {
  questionId: string;
  answerChoice: number | null;
  answerText: string | null;
  spentMilliseconds: number;
  updatedAt: string;
}

export interface AnswerSession {
  id: string;
  mode: 'ONE_BY_ONE' | 'EXAM';
  paper: Paper & { questions: SolveQuestion[] };
  draftAnswers: DraftAnswer[];
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerSessionLog {
  id: string;
  mode: 'ONE_BY_ONE' | 'EXAM';
  paper: Paper;
  answeredCount: number;
  correctCount: number;
  totalSpentMilliseconds: number;
  submittedAt: string;
  createdAt: string;
}

export const getBookshelves = cache(async (): Promise<Bookshelf[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { bookshelves: Bookshelf[] } }>(
    '/library/bookshelves',
    token,
  );
  return res.data.bookshelves;
});

export const getAnswerSession = cache(
  async (id: string): Promise<AnswerSession> => {
    const token = await getToken();
    if (!token) throw new Error('로그인이 필요합니다.');
    const res = await api.get<{ data: { session: AnswerSession } }>(
      `/answer-sessions/${id}`,
      token,
    );
    return res.data.session;
  },
);

export const getAnswerSessionLogs = cache(
  async (): Promise<AnswerSessionLog[]> => {
    const token = await getToken();
    if (!token) return [];
    const res = await api.get<{ data: { logs: AnswerSessionLog[] } }>(
      '/answer-sessions',
      token,
    );
    return res.data.logs;
  },
);
