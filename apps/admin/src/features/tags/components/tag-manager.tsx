import type {
  AdminTagGroupResponse,
  AdminTagResponse,
} from '@kichulbot/api-contract/tags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import type { Taxonomy } from '@/shared/types';

import {
  useDeleteTagGroupMutation,
  useDeleteTagMutation,
  useSaveTagGroupMutation,
  useSaveTagMutation,
} from '../mutations';
import { tagGroupsQueryOptions, tagsQueryOptions } from '../queries';
import { TagFormPanel } from './tag-form';
import { TagGroupPanel } from './tag-group-panel';
import { TagListPanel } from './tag-list';

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
  const [editingTagGroup, setEditingTagGroup] =
    React.useState<AdminTagGroupResponse | null>(null);
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
  const tagGroupsQuery = useQuery({
    ...tagGroupsQueryOptions(token, selectedExamId),
    enabled: !!selectedExamId,
  });

  function resetForm() {
    setEditingTag(null);
  }

  function resetGroupForm() {
    setEditingTagGroup(null);
  }

  function selectExam(examId: string) {
    setSelectedExamId(examId);
    setEditingTag(null);
    setEditingTagGroup(null);
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
  const saveGroupMutation = useSaveTagGroupMutation(
    token,
    editingTagGroup?.id ?? null,
    resetGroupForm,
  );
  const deleteGroupMutation = useDeleteTagGroupMutation(token, (tagGroupId) => {
    if (editingTagGroup?.id === tagGroupId) {
      resetGroupForm();
    }
  });

  function beginEdit(tag: AdminTagResponse) {
    setEditingTag(tag);
  }

  function beginEditTagGroup(tagGroup: AdminTagGroupResponse) {
    setEditingTagGroup(tagGroup);
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

  function handleDeleteTagGroup(tagGroup: AdminTagGroupResponse) {
    if (tagGroup.tagCount > 0) {
      return;
    }

    const shouldDelete = window.confirm(
      `${tagGroup.name} 태그 그룹을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (shouldDelete) {
      deleteGroupMutation.mutate(tagGroup.id);
    }
  }

  const tags = (tagsQuery.data?.tags ?? []) as AdminTagResponse[];
  const tagGroups = tagGroupsQuery.data?.tagGroups ?? [];

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
        tagGroups={tagGroups}
        editingTag={editingTag}
        isSubmitting={saveMutation.isPending || !selectedExam}
        onSubmit={(values) => {
          if (!selectedExamId) return;
          saveMutation.mutate({ ...values, examId: selectedExamId });
        }}
        onCancel={resetForm}
      />
      <div className="lg:col-span-2">
        <TagGroupPanel
          selectedExam={selectedExam}
          tagGroups={tagGroups}
          editingTagGroup={editingTagGroup}
          isLoading={tagGroupsQuery.isLoading}
          isSubmitting={saveGroupMutation.isPending || !selectedExam}
          deletingTagGroupId={
            deleteGroupMutation.isPending
              ? (deleteGroupMutation.variables ?? null)
              : null
          }
          onEdit={beginEditTagGroup}
          onDelete={handleDeleteTagGroup}
          onSubmit={(values) => {
            if (!selectedExamId) return;
            saveGroupMutation.mutate({
              ...values,
              examId: selectedExamId,
            });
          }}
          onCancel={resetGroupForm}
        />
      </div>
    </div>
  );
}
