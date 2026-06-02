import {
  QuestionNoteResponseEnvelopeSchema,
  SaveQuestionNoteRequestSchema,
} from './dto.js';

export const questionNoteRoutes = {
  getQuestionNote: {
    method: 'GET',
    path: '/me/question-notes/:questionId',
    request: null,
    response: QuestionNoteResponseEnvelopeSchema,
  },
  saveQuestionNote: {
    method: 'PUT',
    path: '/me/question-notes/:questionId',
    request: SaveQuestionNoteRequestSchema,
    response: QuestionNoteResponseEnvelopeSchema,
  },
} as const;
