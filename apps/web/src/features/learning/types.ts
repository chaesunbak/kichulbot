import type {
  AddBookmarkedQuestionResponse,
  BookmarkListResponseEnvelope,
  ListBookmarkListsResponse,
} from '@kichulbot/api-contract/bookmarks';
import type { LibraryResponse } from '@kichulbot/api-contract/library';
import type { StartMockExamSolveSessionResponse } from '@kichulbot/api-contract/mock-exams';
import type { QuestionNoteResponseEnvelope } from '@kichulbot/api-contract/question-notes';
import type { CreateQuestionReportRequest } from '@kichulbot/api-contract/question-reports';
import type { GetRecapSummaryResponse } from '@kichulbot/api-contract/recap';
import type { GetWrongQuestionSetResponse } from '@kichulbot/api-contract/review';
import type {
  ListSolveSessionLogsQuery,
  ListSolveSessionLogsResponse,
  SaveAnswerResponse,
  StartSolveSessionResponse,
} from '@kichulbot/api-contract/solve-sessions';

export type Library = LibraryResponse;
export type LibraryFolder = LibraryResponse['folders'][number];
export type LibraryPaper = LibraryResponse['papers'][number];

export type BookmarkListSummary =
  ListBookmarkListsResponse['bookmarkLists'][number];
export type BookmarkedQuestion = AddBookmarkedQuestionResponse['question'];
export type BookmarkList = BookmarkListResponseEnvelope['bookmarkList'];

export type QuestionNote = NonNullable<QuestionNoteResponseEnvelope['note']>;
export type QuestionReportCategory = CreateQuestionReportRequest['category'];

export type SolveSession = StartSolveSessionResponse['session'];
export type SolveQuestion = SolveSession['paper']['questions'][number];
export type QuestionResult = NonNullable<SolveQuestion['result']>;
export type Answer = SaveAnswerResponse['answer'];
export type SolveSessionResult = NonNullable<SolveSession['result']>;
export type SolveMode = 'ONE_BY_ONE' | 'EXAM';
export type SolveSessionLog = ListSolveSessionLogsResponse['logs'][number];
export type SolveSessionLogStatus = NonNullable<
  ListSolveSessionLogsQuery['status']
>;
export type SolveSessionLogPage = ListSolveSessionLogsResponse;
export type RecapSummary = GetRecapSummaryResponse;
export type RecapTodayStats = RecapSummary['todayStats'];
export type RecapWrongReview = RecapSummary['wrongReview'];

export type DailyWrongQuestionSet = NonNullable<
  GetWrongQuestionSetResponse['questionSet']
>;
export type MockExamGeneration =
  StartMockExamSolveSessionResponse['generation'];
