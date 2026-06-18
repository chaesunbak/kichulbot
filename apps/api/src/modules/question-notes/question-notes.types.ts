import type { QuestionNoteResponseEnvelope } from '@kichulbot/api-contract/question-notes';

import type { QuestionNotesRepository } from './question-notes.repository';

export type QuestionNoteRecord = NonNullable<
  Awaited<ReturnType<QuestionNotesRepository['findNote']>>
>;

export type QuestionNotePayload = NonNullable<
  QuestionNoteResponseEnvelope['note']
>;
