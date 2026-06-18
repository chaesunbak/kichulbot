import type {
  ListSolveSessionLogsResponse,
  SaveAnswerResponse,
  StartSolveSessionResponse,
} from '@kichulbot/api-contract/solve-sessions';

import type { SolveSessionsRepository } from './solve-sessions.repository';

export type SolveSessionRecord = NonNullable<
  Awaited<ReturnType<SolveSessionsRepository['findById']>>
>;
export type SolveSessionItemRecord = SolveSessionRecord['items'][number];
export type DraftAnswerRecord = NonNullable<SolveSessionItemRecord['draft']>;
export type AttemptRecord = SolveSessionItemRecord['attempts'][number];
export type QuestionRevisionRecord = SolveSessionItemRecord['questionRevision'];
export type GradedAnswer = Pick<AttemptRecord, 'outcome'>;

export type PublicPaperSolveData = NonNullable<
  Awaited<ReturnType<SolveSessionsRepository['findPublishedPaperSolveData']>>
>;

export type AnswerPayload = SaveAnswerResponse['answer'];
export type QuestionResultPayload = NonNullable<SaveAnswerResponse['result']>;
export type SolveSessionPayload = StartSolveSessionResponse['session'];
export type SolveSessionLogItem = ListSolveSessionLogsResponse['logs'][number];
export type SolveSessionResultPayload = NonNullable<
  SolveSessionPayload['result']
>;
