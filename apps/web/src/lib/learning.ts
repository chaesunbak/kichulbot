import { api } from './api';
import { getToken } from './auth';
import type {
  Bookshelf,
  BookmarkListSummary,
  BookmarkList,
  AnswerSession,
  AnswerSessionLog,
  DailyWrongQuestionSet,
} from './learning.types';

export const getBookshelves = async (): Promise<Bookshelf[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { bookshelves: Bookshelf[] } }>(
    '/library/bookshelves',
    token,
  );
  return res.data.bookshelves;
};

export const getBookmarkLists = async (): Promise<BookmarkListSummary[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{
    data: { bookmarkLists: BookmarkListSummary[] };
  }>('/bookmark-lists', token);
  return res.data.bookmarkLists;
};

export const getBookmarkList = async (id: string): Promise<BookmarkList> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await api.get<{ data: { bookmarkList: BookmarkList } }>(
    `/bookmark-lists/${id}`,
    token,
  );
  return res.data.bookmarkList;
};

export const getAnswerSession = async (id: string): Promise<AnswerSession> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await api.get<{ data: { session: AnswerSession } }>(
    `/answer-sessions/${id}`,
    token,
  );
  return res.data.session;
};

export const getAnswerSessionLogs = async (): Promise<AnswerSessionLog[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { logs: AnswerSessionLog[] } }>(
    '/answer-sessions',
    token,
  );
  return res.data.logs;
};

export const getTodayWrongQuestions =
  async (): Promise<DailyWrongQuestionSet | null> => {
    const token = await getToken();
    if (!token) return null;
    const res = await api.get<{
      data: { questionSet: DailyWrongQuestionSet };
    }>('/me/wrong-questions', token);
    return res.data.questionSet;
  };
