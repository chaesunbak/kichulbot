import { ListExamsResponseSchema, ListSubjectsResponseSchema } from './dto.js';

export const taxonomyRoutes = {
  listExams: {
    method: 'GET',
    path: '/exams',
    request: null,
    response: ListExamsResponseSchema,
  },
  listSubjects: {
    method: 'GET',
    path: '/subjects',
    request: null,
    response: ListSubjectsResponseSchema,
  },
} as const;
