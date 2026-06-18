import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { CategoriesList } from '@/features/reference-data/components/categories-list';
import { CategoryFormPanel } from '@/features/reference-data/components/category-form';
import {
  useDeleteCategoryMutation,
  useSaveCategoryMutation,
} from '@/features/reference-data/queries/mutations';
import { categoriesQueryOptions } from '@/features/reference-data/queries/options';
import type { AdminTaxonomy } from '@/shared/types';

export function CategoriesPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingCategory, setEditingCategory] = useState<AdminTaxonomy | null>(
    null,
  );
  const categoriesQuery = useSuspenseQuery(categoriesQueryOptions(token));
  const categories = categoriesQuery.data.categories;

  function resetForm() {
    setEditingCategory(null);
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

  function beginEdit(category: AdminTaxonomy) {
    setEditingCategory(category);
  }

  function handleDelete(category: AdminTaxonomy) {
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
        isSubmitting={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={resetForm}
      />
    </div>
  );
}
