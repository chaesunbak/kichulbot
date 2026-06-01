import {
  CategoryMutationResponseSchema,
  CreateCategoryRequest,
  CreateExamRequest,
  DeleteCategoryResponseSchema,
  DeleteExamResponseSchema,
  ExamMutationResponseSchema,
  ListCategoriesResponseSchema,
  ListExamsResponseSchema,
  UpdateCategoryRequest,
  UpdateExamRequest,
} from '@kichulbot/api-contract/taxonomy';

import { apiRequest } from '@/shared/api/api-client';

export async function fetchExams(token: string) {
  return apiRequest('/exams', ListExamsResponseSchema.parse, { token });
}

export async function createExam(token: string, input: CreateExamRequest) {
  return apiRequest('/exams', ExamMutationResponseSchema.parse, {
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
  return apiRequest(`/exams/${examId}`, ExamMutationResponseSchema.parse, {
    token,
    method: 'PATCH',
    body: input,
  });
}

export async function deleteExam(token: string, examId: string) {
  return apiRequest(`/exams/${examId}`, DeleteExamResponseSchema.parse, {
    token,
    method: 'DELETE',
  });
}

export async function fetchCategories(token: string) {
  return apiRequest('/categories', ListCategoriesResponseSchema.parse, {
    token,
  });
}

export async function createCategory(
  token: string,
  input: CreateCategoryRequest,
) {
  return apiRequest('/categories', CategoryMutationResponseSchema.parse, {
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
    `/categories/${categoryId}`,
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
    `/categories/${categoryId}`,
    DeleteCategoryResponseSchema.parse,
    {
      token,
      method: 'DELETE',
    },
  );
}
