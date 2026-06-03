import {
  type AdminExamResponse,
  type AdminTaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Checkbox } from '@kichulbot/ui/components/ui/checkbox';
import { Field, FieldLabel } from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { Plus } from 'lucide-react';
import * as React from 'react';

import { type ExamForm } from '@/features/reference-data/mutations';

export interface ExamFormPanelProps {
  categories: AdminTaxonomyResponse[];
  form: ExamForm;
  editingExam: AdminExamResponse | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<ExamForm>>;
}

export function ExamFormPanel({
  categories,
  form,
  editingExam,
  isSubmitting,
  onSubmit,
  onCancel,
  onFormChange,
}: ExamFormPanelProps) {
  function toggleCategory(categoryId: string, checked: boolean) {
    onFormChange((current) => ({
      ...current,
      categoryIds: checked
        ? [...current.categoryIds, categoryId]
        : current.categoryIds.filter((id) => id !== categoryId),
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" aria-hidden="true" />
          {editingExam ? '시험 수정' : '시험 추가'}
        </CardTitle>
        <CardDescription>
          문제지 등록에서 선택할 시험과 시행 정보 항목을 관리합니다.
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
            <FieldLabel htmlFor="exam-name">시험 이름</FieldLabel>
            <Input
              id="exam-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="수능 한국사"
            />
          </Field>
          <Field>
            <FieldLabel>분류</FieldLabel>
            <div className="grid gap-2">
              {categories.map((category) => (
                <ToggleRow
                  key={category.id}
                  label={category.name}
                  checked={form.categoryIds.includes(category.id)}
                  onCheckedChange={(checked) =>
                    toggleCategory(category.id, checked)
                  }
                />
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel>시행 정보</FieldLabel>
            <div className="grid gap-2">
              <ToggleRow
                label="시행 월 입력"
                checked={form.usesMonth}
                onCheckedChange={(usesMonth) =>
                  onFormChange((current) => ({ ...current, usesMonth }))
                }
              />
              <ToggleRow
                label="시험 회차 입력"
                checked={form.usesRound}
                onCheckedChange={(usesRound) =>
                  onFormChange((current) => ({ ...current, usesRound }))
                }
              />
            </div>
          </Field>
          <div className="flex gap-2">
            {editingExam && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {editingExam ? '수정 저장' : '시험 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="
        flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2
        text-sm
      "
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
