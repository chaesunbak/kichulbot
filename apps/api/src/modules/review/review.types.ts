import type { GetWrongQuestionSetResponse } from '@kichulbot/api-contract/review';

import type { ReviewRepository } from './review.repository';

export type DailyWrongQuestionSetItem = NonNullable<
  GetWrongQuestionSetResponse['questionSet']
>;

export type DailyWrongQuestionSetRecord = Awaited<
  ReturnType<ReviewRepository['regenerate']>
>;
