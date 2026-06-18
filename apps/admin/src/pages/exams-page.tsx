import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store/use-auth-store';
import { ExamFormPanel } from '@/features/reference-data/components/exam-form';
import { ExamsList } from '@/features/reference-data/components/exams-list';
import {
  useDeleteExamMutation,
  useSaveExamMutation,
} from '@/features/reference-data/queries/mutations';
import {
  categoriesQueryOptions,
  examsQueryOptions,
} from '@/features/reference-data/queries/options';
import {
  tagGroupsQueryOptions,
  tagsQueryOptions,
} from '@/features/tags/queries/options';
import type { AdminExam } from '@/shared/types';

export function ExamsPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingExam, setEditingExam] = useState<AdminExam | null>(null);
  const examsQuery = useSuspenseQuery(examsQueryOptions(token));
  const categoriesQuery = useSuspenseQuery(categoriesQueryOptions(token));
  const exams = examsQuery.data.exams;
  const categories = categoriesQuery.data.categories;
  const tagGroupsQuery = useQuery({
    ...tagGroupsQueryOptions(token, editingExam?.id),
    enabled: !!editingExam,
  });
  const tagsQuery = useQuery({
    ...tagsQueryOptions(token, editingExam?.id),
    enabled: !!editingExam,
  });
  const tagGroups = tagGroupsQuery.data?.tagGroups ?? [];
  const tags = tagsQuery.data?.tags ?? [];

  function resetForm() {
    setEditingExam(null);
  }

  const saveMutation = useSaveExamMutation(
    token,
    editingExam?.id ?? null,
    resetForm,
  );
  const deleteMutation = useDeleteExamMutation(token, (examId) => {
    if (editingExam?.id === examId) {
      resetForm();
    }
  });

  function beginEdit(exam: AdminExam) {
    setEditingExam(exam);
  }

  function handleDelete(exam: AdminExam) {
    if (exam.paperCount > 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `${exam.name} 시험을 삭제할까요?\n연결된 분류와 태그 관계도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (shouldDelete) {
      deleteMutation.mutate(exam.id);
    }
  }

  return (
    <div
      className="
        mx-auto grid max-w-7xl gap-5 px-5 py-6
        lg:grid-cols-[1fr_minmax(320px,420px)]
      "
    >
      <ExamsList
        exams={exams}
        deletingExamId={
          deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
        }
        onEdit={beginEdit}
        onDelete={handleDelete}
      />
      <ExamFormPanel
        key={editingExam?.id ?? 'new'}
        categories={categories}
        tagGroups={tagGroups}
        tags={tags}
        isTagsLoading={!!editingExam && !tagsQuery.data && tagsQuery.isPending}
        editingExam={editingExam}
        isSubmitting={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={resetForm}
      />
    </div>
  );
}
