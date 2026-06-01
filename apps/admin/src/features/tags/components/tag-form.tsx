import type { AdminTagResponse } from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { Field, FieldLabel } from '@kichulbot/ui/components/field';
import { Input } from '@kichulbot/ui/components/input';
import { Plus } from 'lucide-react';
import * as React from 'react';

import { type Taxonomy } from '@/shared/types';

import { type TagForm } from '../mutations';

export interface TagFormPanelProps {
  selectedExam: Taxonomy | null;
  editingTag: AdminTagResponse | null;
  form: TagForm;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<TagForm>>;
}

export function TagFormPanel({
  selectedExam,
  editingTag,
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  onFormChange,
}: TagFormPanelProps) {
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
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Field>
            <FieldLabel htmlFor="tag-name">태그 이름</FieldLabel>
            <Input
              id="tag-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="조선"
            />
          </Field>
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
