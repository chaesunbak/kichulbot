import type { AdminTaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { useAuthStore } from '@/features/auth/store';
import { CategoriesList } from '@/features/reference-data/components/categories-list';
import { CategoryFormPanel } from '@/features/reference-data/components/category-form';
import {
  type CategoryForm,
  useDeleteCategoryMutation,
  useSaveCategoryMutation,
} from '@/features/reference-data/mutations';
import { categoriesQueryOptions } from '@/features/reference-data/queries';

const EMPTY_FORM: CategoryForm = { name: '' };

export function CategoriesPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingCategory, setEditingCategory] =
    React.useState<AdminTaxonomyResponse | null>(null);
  const [form, setForm] = React.useState<CategoryForm>(EMPTY_FORM);
  const categories =
    (useQuery(categoriesQueryOptions(token)).data
      ?.categories as AdminTaxonomyResponse[]) ?? [];

  function resetForm() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }

  const saveMutation = useSaveCategoryMutation(
    token,
    editingCategory?.id ?? null,
    resetForm,
  );
  const deleteMutation = useDeleteCategoryMutation(token, (categoryId) => {
    if (editingCategory?.id === categoryId) {
      resetForm();
    }
  });

  function beginEdit(category: AdminTaxonomyResponse) {
    setEditingCategory(category);
    setForm({ name: category.name });
  }

  function handleDelete(category: AdminTaxonomyResponse) {
    if (
      window.confirm(
        `${category.name} 분류를 삭제할까요?\n시험과의 분류 연결도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      deleteMutation.mutate(category.id);
    }
  }

  return (
    <div
      className="
        mx-auto grid max-w-7xl gap-5 px-5 py-6
        lg:grid-cols-[1fr_minmax(320px,420px)]
      "
    >
      <CategoriesList
        categories={categories}
        deletingCategoryId={
          deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
        }
        onEdit={beginEdit}
        onDelete={handleDelete}
      />
      <CategoryFormPanel
        editingCategory={editingCategory}
        form={form}
        isSubmitting={saveMutation.isPending}
        onSubmit={() => {
          saveMutation.mutate(form);
        }}
        onCancel={resetForm}
        onFormChange={setForm}
      />
    </div>
  );
}
