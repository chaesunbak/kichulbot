import type {
  Answer,
  DailyWrongQuestionSet,
  MockExamGeneration,
  QuestionNote,
  QuestionReportCategory,
  QuestionResult,
  SolveMode,
  SolveSession,
} from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

export async function createSolveSession({
  paperId,
  mode,
}: {
  paperId: string;
  mode: SolveMode;
}): Promise<SolveSession> {
  const body = await clientApi.post<{ session: SolveSession }>(
    '/api/me/solve-sessions',
    { paperId, mode },
  );
  return body.session;
}

export async function createWrongQuestionSolveSession({
  questionSetId,
  mode,
}: {
  questionSetId: string;
  mode: SolveMode;
}): Promise<SolveSession> {
  const body = await clientApi.post<{ session: SolveSession }>(
    `/api/me/wrong-question-sets/${questionSetId}/solve-sessions`,
    { mode },
  );
  return body.session;
}

export async function createLatestWrongQuestionSolveSession({
  mode,
}: {
  mode: SolveMode;
}): Promise<SolveSession> {
  const body = await clientApi.post<{ session: SolveSession }>(
    '/api/me/wrong-question-sets/solve-sessions',
    { mode },
  );
  return body.session;
}

export async function createBookmarkListSolveSession({
  bookmarkListId,
  mode,
}: {
  bookmarkListId: string;
  mode: SolveMode;
}): Promise<SolveSession> {
  const body = await clientApi.post<{ session: SolveSession }>(
    `/api/me/question-lists/${bookmarkListId}/solve-sessions`,
    { mode },
  );
  return body.session;
}

export async function createMockExamSolveSession({
  examId,
  mode,
}: {
  examId: string;
  mode: SolveMode;
}): Promise<{ session: SolveSession; generation: MockExamGeneration }> {
  return clientApi.post<{
    session: SolveSession;
    generation: MockExamGeneration;
  }>('/api/me/mock-exams/solve-sessions', { examId, mode });
}

export async function refreshWrongQuestionSet(
  studyDate: string,
): Promise<DailyWrongQuestionSet> {
  const body = await clientApi.post<{ questionSet: DailyWrongQuestionSet }>(
    '/api/me/wrong-question-sets',
    { studyDate },
  );
  return body.questionSet;
}

export async function saveSolveSessionAnswer({
  sessionId,
  questionId,
  payload,
}: {
  sessionId: string;
  questionId: string;
  payload: {
    answerChoice?: number;
    answerText?: string;
    spentMilliseconds?: number;
  };
}): Promise<{ answer: Answer; result: QuestionResult | null }> {
  return clientApi.put<{ answer: Answer; result: QuestionResult | null }>(
    `/api/me/solve-sessions/${sessionId}/answers/${questionId}`,
    payload,
  );
}

export async function submitSolveSession(
  sessionId: string,
): Promise<SolveSession> {
  const body = await clientApi.post<{ session: SolveSession }>(
    `/api/me/solve-sessions/${sessionId}/submissions`,
  );
  return body.session;
}

export async function saveQuestionNote({
  questionId,
  content,
}: {
  questionId: string;
  content: string;
}): Promise<QuestionNote | null> {
  const body = await clientApi.put<{ note: QuestionNote | null }>(
    `/api/me/question-notes/${questionId}`,
    { content },
  );
  return body.note;
}

export async function createQuestionReport({
  questionId,
  questionRevisionId,
  category,
  content,
  isAuthenticated = true,
}: {
  questionId: string;
  questionRevisionId: string;
  category: QuestionReportCategory;
  content: string;
  isAuthenticated?: boolean;
}) {
  const path = isAuthenticated
    ? `/api/question-reports/${questionId}`
    : `/api/public/question-reports/${questionId}`;

  await clientApi.post(path, {
    questionRevisionId,
    category,
    content,
  });
}
