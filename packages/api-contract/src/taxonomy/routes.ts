import {
  CategoryMutationResponseSchema,
  CreateCategoryRequestSchema,
  CreateExamRequestSchema,
  DeleteCategoryResponseSchema,
  DeleteExamResponseSchema,
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
  deleteExam: {
    method: 'DELETE',
    path: '/exams/:id',
    request: null,
    response: DeleteExamResponseSchema,
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
  deleteCategory: {
    method: 'DELETE',
    path: '/categories/:id',
    request: null,
    response: DeleteCategoryResponseSchema,
  },
} as const;
