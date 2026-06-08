import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { type AdminTaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
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
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { categoryFormSchema } from '@/features/reference-data/schemas';
import type { CategoryForm } from '@/features/reference-data/types';

export interface CategoryFormPanelProps {
  editingCategory: AdminTaxonomyResponse | null;
  isSubmitting: boolean;
  onSubmit: (values: CategoryForm) => void;
  onCancel: () => void;
}

export function CategoryFormPanel({
  editingCategory,
  isSubmitting,
  onSubmit,
  onCancel,
}: CategoryFormPanelProps) {
  const form = useForm<CategoryForm>({
    resolver: standardSchemaResolver(categoryFormSchema),
    defaultValues: getCategoryFormValues(editingCategory),
  });

  React.useEffect(() => {
    form.reset(getCategoryFormValues(editingCategory));
  }, [editingCategory, form]);

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
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>분류 이름</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="수능"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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

function getCategoryFormValues(
  editingCategory: AdminTaxonomyResponse | null,
): CategoryForm {
  return {
    name: editingCategory?.name ?? '',
  };
}
