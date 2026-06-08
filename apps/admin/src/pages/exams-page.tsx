import type {
  AdminExamResponse,
  AdminTaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { useAuthStore } from '@/features/auth/store';
import { ExamFormPanel } from '@/features/reference-data/components/exam-form';
import { ExamsList } from '@/features/reference-data/components/exams-list';
import {
  useDeleteExamMutation,
  useSaveExamMutation,
} from '@/features/reference-data/mutations';
import {
  categoriesQueryOptions,
  examsQueryOptions,
} from '@/features/reference-data/queries';

export function ExamsPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingExam, setEditingExam] =
    React.useState<AdminExamResponse | null>(null);
  const exams =
    (useQuery(examsQueryOptions(token)).data?.exams as AdminExamResponse[]) ??
    [];
  const categories =
    (useQuery(categoriesQueryOptions(token)).data
      ?.categories as AdminTaxonomyResponse[]) ?? [];

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

  function beginEdit(exam: AdminExamResponse) {
    setEditingExam(exam);
  }

  function handleDelete(exam: AdminExamResponse) {
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
        categories={categories}
        editingExam={editingExam}
        isSubmitting={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutate(values)}
        onCancel={resetForm}
      />
    </div>
  );
}
