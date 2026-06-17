import type {
  Answer,
  QuestionResult,
  SolveSession,
} from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

const STORAGE_PREFIX = 'kichulbot:local-solve-session:';
type SolveMode = SolveSession['mode'];

type LocalSolveSessionRecord = {
  session: SolveSession;
  answerKeys: Record<string, QuestionResult>;
};

type SaveLocalAnswerPayload = {
  answerChoice?: number;
  answerText?: string;
  spentMilliseconds?: number;
};

export async function createLocalSolveSession({
  paperId,
  mode,
}: {
  paperId: string;
  mode: SolveMode;
}) {
  const res = await clientApi.get<{ data: { session: SolveSession } }>(
    `/api/public/solve-sessions/papers/${paperId}?mode=${mode}`,
  );
  const now = new Date().toISOString();
  const session: SolveSession = {
    ...res.data.session,
    id: `local_${crypto.randomUUID()}`,
    paper: {
      ...res.data.session.paper,
      questions: res.data.session.paper.questions.map((question) => ({
        ...question,
        result: null,
      })),
    },
    answers: [],
    result: null,
    submittedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const answerKeys = Object.fromEntries(
    res.data.session.paper.questions.map((question) => [
      question.id,
      question.result,
    ]),
  ) as Record<string, QuestionResult>;

  writeLocalRecord({ session, answerKeys });
  return session;
}

export function getLocalSolveSession(id: string) {
  return readLocalRecord(id)?.session ?? null;
}

export function getLocalSolveSessionSnapshot(id: string) {
  return readLocalRecordValue(id);
}

export function parseLocalSolveSessionSnapshot(
  snapshot: string | null | undefined,
) {
  if (snapshot === undefined) return undefined;
  if (!snapshot) return null;

  return (JSON.parse(snapshot) as LocalSolveSessionRecord).session;
}

export function saveLocalSolveSessionAnswer({
  sessionId,
  questionId,
  payload,
}: {
  sessionId: string;
  questionId: string;
  payload: SaveLocalAnswerPayload;
}) {
  const record = readRequiredLocalRecord(sessionId);
  const question = record.session.paper.questions.find(
    (question) => question.id === questionId,
  );
  if (!question) throw new Error('문항을 찾을 수 없습니다.');

  const currentAnswer = record.session.answers.find(
    (answer) => answer.questionId === questionId,
  );
  const nextAnswer = toNextAnswer(
    questionId,
    currentAnswer,
    payload,
    record.answerKeys[questionId],
    record.session.mode,
  );
  const result =
    record.session.mode === 'ONE_BY_ONE'
      ? toCheckedResult(record.answerKeys[questionId], nextAnswer)
      : null;
  const now = new Date().toISOString();
  const session: SolveSession = {
    ...record.session,
    paper: {
      ...record.session.paper,
      questions: record.session.paper.questions.map((item) =>
        item.id === questionId && result ? { ...item, result } : item,
      ),
    },
    answers: [
      ...record.session.answers.filter(
        (answer) => answer.questionId !== questionId,
      ),
      nextAnswer,
    ],
    updatedAt: now,
  };

  writeLocalRecord({ ...record, session });
  return { answer: nextAnswer, result };
}

export function submitLocalSolveSession(sessionId: string) {
  const record = readRequiredLocalRecord(sessionId);
  const now = new Date().toISOString();
  const questions = record.session.paper.questions.map((question) => {
    const answer = record.session.answers.find(
      (answer) => answer.questionId === question.id,
    );
    return {
      ...question,
      result: toCheckedResult(record.answerKeys[question.id], answer),
    };
  });
  const result = questions.reduce(
    (summary, question) => {
      const answer = record.session.answers.find(
        (answer) => answer.questionId === question.id,
      );
      const answered = !!answer && hasAnswer(answer);
      return {
        score:
          summary.score + (question.result?.isCorrect ? question.points : 0),
        totalCount: summary.totalCount + 1,
        answeredCount: summary.answeredCount + (answered ? 1 : 0),
        correctCount:
          summary.correctCount + (question.result?.isCorrect ? 1 : 0),
        wrongCount: summary.wrongCount + (question.result?.isCorrect ? 0 : 1),
        totalSpentMilliseconds:
          summary.totalSpentMilliseconds + (answer?.spentMilliseconds ?? 0),
      };
    },
    {
      score: 0,
      totalCount: 0,
      answeredCount: 0,
      correctCount: 0,
      wrongCount: 0,
      totalSpentMilliseconds: 0,
    },
  );
  const session: SolveSession = {
    ...record.session,
    paper: { ...record.session.paper, questions },
    result,
    submittedAt: now,
    updatedAt: now,
  };

  writeLocalRecord({ ...record, session });
  return session;
}

function toNextAnswer(
  questionId: string,
  currentAnswer: Answer | undefined,
  payload: SaveLocalAnswerPayload,
  answerKey: QuestionResult,
  mode: SolveMode,
): Answer {
  const answerChoice =
    payload.answerChoice !== undefined
      ? payload.answerChoice
      : (currentAnswer?.answerChoice ?? null);
  const answerText =
    payload.answerText !== undefined
      ? payload.answerText
      : (currentAnswer?.answerText ?? null);
  const spentMilliseconds =
    (currentAnswer?.spentMilliseconds ?? 0) + (payload.spentMilliseconds ?? 0);
  const checked =
    mode === 'ONE_BY_ONE'
      ? toCheckedResult(answerKey, { answerChoice, answerText })
      : null;

  return {
    questionId,
    answerChoice,
    answerText,
    isCorrect: checked?.isCorrect ?? null,
    spentMilliseconds,
    updatedAt: new Date().toISOString(),
  };
}

function toCheckedResult(
  answerKey: QuestionResult,
  answer?: Pick<Answer, 'answerChoice' | 'answerText'>,
) {
  return {
    ...answerKey,
    isCorrect: isCorrectAnswer(answerKey, answer),
  };
}

function isCorrectAnswer(
  answerKey: QuestionResult,
  answer?: Pick<Answer, 'answerChoice' | 'answerText'>,
) {
  if (!answer || !hasAnswer(answer)) return false;
  if (answerKey.gradingPolicy === 'ANY_CHOICE') {
    return answer.answerChoice !== null;
  }
  if (answerKey.answerChoice !== null) {
    return answer.answerChoice === answerKey.answerChoice;
  }
  return answer.answerText?.trim() === answerKey.answerText?.trim();
}

function hasAnswer(answer: Pick<Answer, 'answerChoice' | 'answerText'>) {
  return answer.answerChoice !== null || !!answer.answerText?.trim();
}

function readRequiredLocalRecord(id: string) {
  const record = readLocalRecord(id);
  if (!record) throw new Error('풀이 세션을 찾을 수 없습니다.');
  return record;
}

function readLocalRecord(id: string): LocalSolveSessionRecord | null {
  const value = readLocalRecordValue(id);
  if (!value) return null;

  return JSON.parse(value) as LocalSolveSessionRecord;
}

function readLocalRecordValue(id: string) {
  return window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
}

function writeLocalRecord(record: LocalSolveSessionRecord) {
  window.localStorage.setItem(
    `${STORAGE_PREFIX}${record.session.id}`,
    JSON.stringify(record),
  );
}
