import type { StartMockExamSolveSessionResponse } from '@kichulbot/api-contract/mock-exams';

import type { MockExamSelectedQuestion } from './mock-exams.repository';
import type { MockExamsRepository } from './mock-exams.repository';

export type ConfiguredMockExam = NonNullable<
  Awaited<ReturnType<MockExamsRepository['findExam']>>
>;
export type MockExamBlueprintItem =
  ConfiguredMockExam['mockExamBlueprintItems'][number];
export type MockExamCandidateQuestion = Awaited<
  ReturnType<MockExamsRepository['findPublishedQuestionCandidates']>
>[number];
export type MockExamGenerationPayload =
  StartMockExamSolveSessionResponse['generation'];
export type MockExamSolveSessionPayload =
  StartMockExamSolveSessionResponse['session'];

export type MockExamCandidate = {
  questionId: string;
  revision: MockExamCandidateQuestion['revisions'][number];
  tagIds: Set<string>;
};

export type MockExamSelection = MockExamSelectedQuestion & {
  questionId: string;
  revision: MockExamCandidateQuestion['revisions'][number];
  selectedTagId: string | null;
  supplemented: boolean;
};
