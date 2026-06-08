import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type {
  AdminTagGroupResponse,
  AdminTagResponse,
} from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { type Taxonomy } from '@/shared/types';

import { tagFormSchema } from '../schemas';
import type { TagForm } from '../types';

export interface TagFormPanelProps {
  selectedExam: Taxonomy | null;
  tagGroups: AdminTagGroupResponse[];
  editingTag: AdminTagResponse | null;
  isSubmitting: boolean;
  onSubmit: (values: TagForm) => void;
  onCancel: () => void;
}

export function TagFormPanel({
  selectedExam,
  tagGroups,
  editingTag,
  isSubmitting,
  onSubmit,
  onCancel,
}: TagFormPanelProps) {
  const form = useForm<TagForm>({
    resolver: standardSchemaResolver(tagFormSchema),
    defaultValues: getTagFormValues(editingTag, selectedExam?.id ?? ''),
  });

  React.useEffect(() => {
    form.reset(getTagFormValues(editingTag, selectedExam?.id ?? ''));
  }, [editingTag, form, selectedExam?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" aria-hidden="true" />
          {editingTag ? '태그 수정' : '태그 추가'}
        </CardTitle>
        <CardDescription>
          {selectedExam
            ? `${selectedExam.name} 문항 편집에 노출할 태그를 관리합니다.`
            : '태그를 추가하려면 먼저 시험을 선택해 주세요.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>태그 이름</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="조선"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="tagGroupId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>태그 그룹</FieldLabel>
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? null : value)
                  }
                  disabled={!selectedExam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="그룹 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">그룹 없음</SelectItem>
                    {tagGroups.map((tagGroup) => (
                      <SelectItem key={tagGroup.id} value={tagGroup.id}>
                        {tagGroup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <div className="flex gap-2">
            {editingTag && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {editingTag ? '수정 저장' : '태그 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getTagFormValues(
  editingTag: AdminTagResponse | null,
  examId: string,
): TagForm {
  return {
    name: editingTag?.name ?? '',
    examId: editingTag?.examId ?? examId,
    tagGroupId: editingTag?.tagGroupId ?? null,
  };
}
