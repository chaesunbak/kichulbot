import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { getCategoryFormValues } from '@/features/reference-data/lib/form-values';
import { categoryFormSchema } from '@/features/reference-data/schemas';
import type { CategoryForm } from '@/features/reference-data/types';
import { TextField } from '@/shared/components/form-fields';
import { type AdminTaxonomy } from '@/shared/types';

interface CategoryFormPanelProps {
  editingCategory: AdminTaxonomy | null;
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
  const { reset } = form;

  useEffect(() => {
    reset(getCategoryFormValues(editingCategory));
  }, [editingCategory, reset]);

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
          <TextField
            control={form.control}
            name="name"
            label="분류 이름"
            placeholder="수능"
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
