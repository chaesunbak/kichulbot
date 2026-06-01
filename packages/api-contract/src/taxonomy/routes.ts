import {
  CategoryMutationResponseSchema,
  CreateCategoryRequestSchema,
  CreateExamRequestSchema,
  ExamMutationResponseSchema,
  ListCategoriesResponseSchema,
  ListExamsResponseSchema,
  UpdateCategoryRequestSchema,
  UpdateExamRequestSchema,
} from './dto.js';

export const taxonomyRoutes = {
  listExams: {
    method: 'GET',
    path: '/exams',
    request: null,
    response: ListExamsResponseSchema,
  },
  createExam: {
    method: 'POST',
    path: '/exams',
    request: CreateExamRequestSchema,
    response: ExamMutationResponseSchema,
  },
  updateExam: {
    method: 'PATCH',
    path: '/exams/:id',
    request: UpdateExamRequestSchema,
    response: ExamMutationResponseSchema,
  },
  listCategories: {
    method: 'GET',
    path: '/categories',
    request: null,
    response: ListCategoriesResponseSchema,
  },
  createCategory: {
    method: 'POST',
    path: '/categories',
    request: CreateCategoryRequestSchema,
    response: CategoryMutationResponseSchema,
  },
  updateCategory: {
    method: 'PATCH',
    path: '/categories/:id',
    request: UpdateCategoryRequestSchema,
    response: CategoryMutationResponseSchema,
  },
} as const;
