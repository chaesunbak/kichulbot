import type { AdminTagResponse } from '@kichulbot/api-contract/tags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import type { Taxonomy } from '@/shared/types';

import type { TagForm } from '../mutations';
import { useDeleteTagMutation, useSaveTagMutation } from '../mutations';
import { tagsQueryOptions } from '../queries';
import { TagFormPanel } from './tag-form';
import { TagListPanel } from './tag-list';

const EMPTY_FORM: TagForm = { name: '', examId: '' };

export function TagManager({
  token,
  exams,
}: {
  token: string;
  exams: Taxonomy[];
}) {
  const [editingTag, setEditingTag] = React.useState<AdminTagResponse | null>(
    null,
  );
  const [form, setForm] = React.useState<TagForm>(EMPTY_FORM);
  const [selectedExamId, setSelectedExamId] = React.useState('');

  React.useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) ?? null;
  const tagsQuery = useQuery({
    ...tagsQueryOptions(token, selectedExamId),
    enabled: !!selectedExamId,
  });

  function resetForm() {
    setEditingTag(null);
    setForm({ ...EMPTY_FORM, examId: selectedExamId });
  }

  function selectExam(examId: string) {
    setSelectedExamId(examId);
    setEditingTag(null);
    setForm({ ...EMPTY_FORM, examId });
  }

  const saveMutation = useSaveTagMutation(
    token,
    editingTag?.id ?? null,
    resetForm,
  );
  const deleteMutation = useDeleteTagMutation(token, (tagId) => {
    if (editingTag?.id === tagId) {
      resetForm();
    }
  });

  function beginEdit(tag: AdminTagResponse) {
    setEditingTag(tag);
    setForm({
      name: tag.name,
      examId: selectedExamId || tag.examId,
    });
  }

  function handleDelete(tag: AdminTagResponse) {
    if (tag.questionCount > 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `${tag.name} 태그를 삭제할까요?\n적용 시험 연결도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (shouldDelete) {
      deleteMutation.mutate(tag.id);
    }
  }

  const tags = (tagsQuery.data?.tags ?? []) as AdminTagResponse[];

  return (
    <div
      className="
        mx-auto grid max-w-7xl gap-5 px-5 py-6
        lg:grid-cols-[1fr_minmax(320px,420px)]
      "
    >
      <div className="lg:col-span-2">
        <div
          className="
            flex flex-col gap-2
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <div>
            <h1 className="text-xl font-semibold">시험별 태그</h1>
            <p className="text-sm text-muted-foreground">
              시험을 먼저 선택한 뒤 해당 시험에서 사용할 태그를 관리합니다.
            </p>
          </div>
          <Select
            value={selectedExamId}
            onValueChange={selectExam}
            disabled={exams.length === 0}
          >
            <SelectTrigger
              className="
                w-full
                sm:w-80
              "
            >
              <SelectValue placeholder="시험 선택" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TagListPanel
        tags={tags}
        selectedExam={selectedExam}
        isLoading={tagsQuery.isLoading}
        deletingTagId={
          deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
        }
        onEdit={beginEdit}
        onDelete={handleDelete}
      />
      <TagFormPanel
        selectedExam={selectedExam}
        editingTag={editingTag}
        form={form}
        isSubmitting={saveMutation.isPending || !selectedExam}
        onSubmit={() => {
          if (!selectedExamId) return;
          saveMutation.mutate({ ...form, examId: selectedExamId });
        }}
        onCancel={resetForm}
        onFormChange={setForm}
      />
    </div>
  );
}
