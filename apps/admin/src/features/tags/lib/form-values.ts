import type {
  AdminTagGroupResponse,
  AdminTagResponse,
} from '@kichulbot/api-contract/tags';

import type { TagForm, TagGroupForm } from '../types';

export function getTagFormValues(
  editingTag: AdminTagResponse | null,
  examId: string,
): TagForm {
  return {
    name: editingTag?.name ?? '',
    keywords: editingTag?.keywords ?? [],
    examId: editingTag?.examId ?? examId,
    tagGroupId: editingTag?.tagGroupId ?? null,
    sortOrder: editingTag?.sortOrder ?? 0,
  };
}

export function getTagGroupFormValues(
  editingTagGroup: AdminTagGroupResponse | null,
  examId: string,
): TagGroupForm {
  return {
    examId: editingTagGroup?.examId ?? examId,
    name: editingTagGroup?.name ?? '',
    selectionMode: editingTagGroup?.selectionMode ?? 'MULTIPLE',
    sortOrder: editingTagGroup?.sortOrder ?? 0,
    isActive: editingTagGroup?.isActive ?? true,
  };
}

export function uniqueKeywords(keywords: string[]) {
  return [
    ...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)),
  ];
}
