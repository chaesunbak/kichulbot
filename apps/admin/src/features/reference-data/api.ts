import type {
  CreateCategoryRequest,
  CreateExamRequest,
  UpdateCategoryRequest,
  UpdateExamRequest,
} from '@kichulbot/api-contract/taxonomy';
import {
  CategoryMutationResponseSchema,
  DeleteCategoryResponseSchema,
  DeleteExamResponseSchema,
  ExamMutationResponseSchema,
} from '@kichulbot/api-contract/taxonomy';

import { apiRequest } from '@/shared/api/api-client';

import {
  adminListCategoriesResponseSchema,
  adminListExamsResponseSchema,
} from './schemas';

export async function fetchExams(token: string) {
  return apiRequest('/admin/exams', adminListExamsResponseSchema.parse, {
    token,
  });
}

export async function fetchCategories(token: string) {
  return apiRequest(
    '/admin/categories',
    adminListCategoriesResponseSchema.parse,
    {
      token,
    },
  );
}

export async function createExam(token: string, input: CreateExamRequest) {
  return apiRequest('/admin/exams', ExamMutationResponseSchema.parse, {
    token,
    method: 'POST',
    body: input,
  });
}

export async function updateExam(
  token: string,
  examId: string,
  input: UpdateExamRequest,
) {
  return apiRequest(
    `/admin/exams/${examId}`,
    ExamMutationResponseSchema.parse,
    {
      token,
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteExam(token: string, examId: string) {
  return apiRequest(`/admin/exams/${examId}`, DeleteExamResponseSchema.parse, {
    token,
    method: 'DELETE',
  });
}

export async function createCategory(
  token: string,
  input: CreateCategoryRequest,
) {
  return apiRequest('/admin/categories', CategoryMutationResponseSchema.parse, {
    token,
    method: 'POST',
    body: input,
  });
}

export async function updateCategory(
  token: string,
  categoryId: string,
  input: UpdateCategoryRequest,
) {
  return apiRequest(
    `/admin/categories/${categoryId}`,
    CategoryMutationResponseSchema.parse,
    {
      token,
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteCategory(token: string, categoryId: string) {
  return apiRequest(
    `/admin/categories/${categoryId}`,
    DeleteCategoryResponseSchema.parse,
    {
      token,
      method: 'DELETE',
    },
  );
}
