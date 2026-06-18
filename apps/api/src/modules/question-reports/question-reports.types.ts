import type { QuestionReportMutationResponse } from '@kichulbot/api-contract/question-reports';

import type { QuestionReportsRepository } from './question-reports.repository';

export type QuestionReportRecord = NonNullable<
  Awaited<ReturnType<QuestionReportsRepository['findById']>>
>;

export type QuestionReportItem = QuestionReportMutationResponse['report'];
