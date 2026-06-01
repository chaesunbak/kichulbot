import type { AdminTaxonomyResponse } from '@kichulbot/api-contract/taxonomy';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { FolderTree, Pencil, Plus } from 'lucide-react';
import * as React from 'react';

import { useAuthStore } from '@/features/auth/store';
import {
  type CategoryForm,
  useSaveCategoryMutation,
} from '@/features/reference-data/mutations';
import { categoriesQueryOptions } from '@/features/reference-data/queries';

const EMPTY_FORM: CategoryForm = { name: '' };

export function CategoriesPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingCategory, setEditingCategory] =
    React.useState<AdminTaxonomyResponse | null>(null);
  const [form, setForm] = React.useState<CategoryForm>(EMPTY_FORM);
  const categories =
    (useQuery(categoriesQueryOptions(token)).data
      ?.categories as AdminTaxonomyResponse[]) ?? [];

  function resetForm() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }

  const saveMutation = useSaveCategoryMutation(
    token,
    editingCategory?.id ?? null,
    resetForm,
  );

  function beginEdit(category: AdminTaxonomyResponse) {
    setEditingCategory(category);
    setForm({ name: category.name });
  }

  return (
    <div className="
      mx-auto grid max-w-7xl gap-5 px-5 py-6
      lg:grid-cols-[minmax(320px,420px)_1fr]
    ">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="size-4" aria-hidden="true" />
            분류 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>분류</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead>
                  <span className="sr-only">수정</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEdit(category)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      수정
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
              saveMutation.mutate(form);
            }}
          >
            <Field>
              <FieldLabel htmlFor="category-name">분류 이름</FieldLabel>
              <Input
                id="category-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="수능"
              />
            </Field>
            <div className="flex gap-2">
              {editingCategory && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
              <Button
                className="flex-1"
                type="submit"
                disabled={saveMutation.isPending}
              >
                {editingCategory ? '수정 저장' : '분류 추가'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
