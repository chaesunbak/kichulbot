import { type AdminTaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
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

import { type CategoryForm } from '@/features/reference-data/mutations';

export interface CategoryFormPanelProps {
  editingCategory: AdminTaxonomyResponse | null;
  form: CategoryForm;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<CategoryForm>>;
}

export function CategoryFormPanel({
  editingCategory,
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  onFormChange,
}: CategoryFormPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" aria-hidden="true" />
          {editingCategory ? '분류 수정' : '분류 추가'}
        </CardTitle>
        <CardDescription>
          시험을 묶어 보여줄 상위 분류를 관리합니다.
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
            <FieldLabel htmlFor="category-name">분류 이름</FieldLabel>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="수능"
            />
          </Field>
          <div className="flex gap-2">
            {editingCategory && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {editingCategory ? '수정 저장' : '분류 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
