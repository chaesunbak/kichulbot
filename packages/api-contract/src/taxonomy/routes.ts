import {
  CategoryMutationResponseSchema,
  CreateCategoryRequestSchema,
  CreateExamRequestSchema,
  DeleteCategoryResponseSchema,
  DeleteExamResponseSchema,
  ExamMutationResponseSchema,
  ListExamPaperOverviewsQuerySchema,
  ListExamPaperOverviewsResponseSchema,
  ListCategoriesResponseSchema,
  ListExamsResponseSchema,
  UpdateCategoryRequestSchema,
  UpdateExamRequestSchema,
} from './dto.js';

export const taxonomyRoutes = {
  listExams: {
    method: 'GET',
    path: '/admin/exams',
    request: null,
    response: ListExamsResponseSchema,
  },
  listPublicExams: {
    method: 'GET',
    path: '/public/exams',
    request: null,
    response: ListExamsResponseSchema,
  },
  listExamPaperOverviews: {
    method: 'GET',
    path: '/public/exams/paper-overviews',
    request: ListExamPaperOverviewsQuerySchema,
    response: ListExamPaperOverviewsResponseSchema,
  },
  createExam: {
    method: 'POST',
    path: '/admin/exams',
    request: CreateExamRequestSchema,
    response: ExamMutationResponseSchema,
  },
  updateExam: {
    method: 'PATCH',
    path: '/admin/exams/:id',
    request: UpdateExamRequestSchema,
    response: ExamMutationResponseSchema,
  },
  deleteExam: {
    method: 'DELETE',
    path: '/admin/exams/:id',
    request: null,
    response: DeleteExamResponseSchema,
  },
  listCategories: {
    method: 'GET',
    path: '/admin/categories',
    request: null,
    response: ListCategoriesResponseSchema,
  },
  listPublicCategories: {
    method: 'GET',
    path: '/public/categories',
    request: null,
    response: ListCategoriesResponseSchema,
  },
  createCategory: {
    method: 'POST',
    path: '/admin/categories',
    request: CreateCategoryRequestSchema,
    response: CategoryMutationResponseSchema,
  },
  updateCategory: {
    method: 'PATCH',
    path: '/admin/categories/:id',
    request: UpdateCategoryRequestSchema,
    response: CategoryMutationResponseSchema,
  },
  deleteCategory: {
    method: 'DELETE',
    path: '/admin/categories/:id',
    request: null,
    response: DeleteCategoryResponseSchema,
  },
} as const;
