import { api } from './api';
import { getToken } from './auth';
import type {
  Bookshelf,
  BookmarkListSummary,
  BookmarkList,
  SolveSession,
  SolveSessionLog,
  DailyWrongQuestionSet,
} from './learning.types';

export const getBookshelves = async (): Promise<Bookshelf[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { bookshelves: Bookshelf[] } }>(
    '/me/paper-lists',
    token,
  );
  return res.data.bookshelves;
};

export const getBookmarkLists = async (): Promise<BookmarkListSummary[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{
    data: { bookmarkLists: BookmarkListSummary[] };
  }>('/me/question-lists', token);
  return res.data.bookmarkLists;
};

export const getBookmarkList = async (id: string): Promise<BookmarkList> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await api.get<{ data: { bookmarkList: BookmarkList } }>(
    `/me/question-lists/${id}`,
    token,
  );
  return res.data.bookmarkList;
};

export const getSolveSession = async (id: string): Promise<SolveSession> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await api.get<{ data: { session: SolveSession } }>(
    `/me/solve-sessions/${id}`,
    token,
  );
  return res.data.session;
};

export const getSolveSessionLogs = async (): Promise<SolveSessionLog[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { logs: SolveSessionLog[] } }>(
    '/me/solve-sessions',
    token,
  );
  return res.data.logs;
};

export const getTodayWrongQuestions =
  async (): Promise<DailyWrongQuestionSet | null> => {
    const token = await getToken();
    if (!token) return null;
    const res = await api.post<{
      data: { questionSet: DailyWrongQuestionSet };
    }>('/me/wrong-question-sets', {}, token);
    return res.data.questionSet;
  };
