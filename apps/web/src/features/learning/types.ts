import type {
  BookmarkedQuestionResponse,
  BookmarkListResponse,
  BookmarkListSummaryResponse,
} from '@kichulbot/api-contract/bookmarks';
import type { LibraryResponse } from '@kichulbot/api-contract/library';
import type { QuestionNoteResponse } from '@kichulbot/api-contract/question-notes';
import type { QuestionReportCategory } from '@kichulbot/api-contract/question-reports';
import type { DailyWrongQuestionSetResponse } from '@kichulbot/api-contract/review';
import type {
  AnswerResponse,
  ListSolveSessionLogsResponse,
  QuestionResultResponse,
  SolveQuestionResponse,
  SolveSessionLogResponse,
  SolveSessionLogStatus,
  SolveSessionResponse,
  SolveSessionResultResponse,
} from '@kichulbot/api-contract/solve-sessions';

export type Library = LibraryResponse;
export type LibraryFolder = LibraryResponse['folders'][number];
export type LibraryPaper = LibraryResponse['papers'][number];

export type BookmarkListSummary = BookmarkListSummaryResponse;
export type BookmarkedQuestion = BookmarkedQuestionResponse;
export type BookmarkList = BookmarkListResponse;

export type QuestionNote = QuestionNoteResponse;
export type { QuestionReportCategory };

export type SolveQuestion = SolveQuestionResponse;
export type QuestionResult = QuestionResultResponse;
export type Answer = AnswerResponse;
export type SolveSessionResult = SolveSessionResultResponse;
export type SolveSession = SolveSessionResponse;
export type SolveSessionLog = SolveSessionLogResponse;
export type { SolveSessionLogStatus };
export type SolveSessionLogPage = ListSolveSessionLogsResponse;

export type DailyWrongQuestionSet = DailyWrongQuestionSetResponse;
