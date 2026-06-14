import type { AdminTagResponse } from '@kichulbot/api-contract/tags';
import type {
  AdminExamResponse,
  AdminTaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';

import type { CategoryForm, ExamForm } from '../types';

export function getCategoryFormValues(
  editingCategory: AdminTaxonomyResponse | null,
): CategoryForm {
  return {
    name: editingCategory?.name ?? '',
  };
}

export function getExamFormValues(
  editingExam: AdminExamResponse | null,
): ExamForm {
  return {
    name: editingExam?.name ?? '',
    slug: editingExam?.slug ?? '',
    categoryIds: editingExam?.categories.map((category) => category.id) ?? [],
    usesMonth: editingExam?.usesMonth ?? false,
    usesRound: editingExam?.usesRound ?? false,
    mockExamQuestionCount: editingExam?.mockExamQuestionCount ?? null,
    eraTagGroupId: editingExam?.eraTagGroupId ?? null,
    mockExamBlueprintItems: editingExam?.mockExamBlueprintItems ?? [],
  };
}

export function isAdminTag(value: unknown): value is AdminTagResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'examId' in value &&
    'tagGroupId' in value
  );
}
