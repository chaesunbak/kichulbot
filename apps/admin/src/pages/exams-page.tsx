import type {
  AdminExamResponse,
  AdminTaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
import { Badge } from '@kichulbot/ui/components/badge';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { Checkbox } from '@kichulbot/ui/components/checkbox';
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
import { ClipboardList, Pencil, Plus } from 'lucide-react';
import * as React from 'react';

import { useAuthStore } from '@/features/auth/store';
import {
  type ExamForm,
  useSaveExamMutation,
} from '@/features/reference-data/mutations';
import {
  categoriesQueryOptions,
  examsQueryOptions,
} from '@/features/reference-data/queries';

const EMPTY_FORM: ExamForm = {
  name: '',
  categoryIds: [],
  usesMonth: false,
  usesGrade: false,
  usesRound: false,
};

export function ExamsPage() {
  const token = useAuthStore((state) => state.token)!;
  const [editingExam, setEditingExam] =
    React.useState<AdminExamResponse | null>(null);
  const [form, setForm] = React.useState<ExamForm>(EMPTY_FORM);
  const exams =
    (useQuery(examsQueryOptions(token)).data?.exams as AdminExamResponse[]) ??
    [];
  const categories =
    (useQuery(categoriesQueryOptions(token)).data
      ?.categories as AdminTaxonomyResponse[]) ?? [];

  function resetForm() {
    setEditingExam(null);
    setForm(EMPTY_FORM);
  }

  const saveMutation = useSaveExamMutation(
    token,
    editingExam?.id ?? null,
    resetForm,
  );

  function beginEdit(exam: AdminExamResponse) {
    setEditingExam(exam);
    setForm({
      name: exam.name,
      categoryIds: exam.categories.map((category) => category.id),
      usesMonth: exam.usesMonth,
      usesGrade: exam.usesGrade,
      usesRound: exam.usesRound,
    });
  }

  function toggleCategory(categoryId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      categoryIds: checked
        ? [...current.categoryIds, categoryId]
        : current.categoryIds.filter((id) => id !== categoryId),
    }));
  }

  return (
    <div className="
      mx-auto grid max-w-7xl gap-5 px-5 py-6
      lg:grid-cols-[minmax(320px,420px)_1fr]
    ">
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
              saveMutation.mutate(form);
            }}
          >
            <Field>
              <FieldLabel htmlFor="exam-name">시험 이름</FieldLabel>
              <Input
                id="exam-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
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
                    setForm((current) => ({ ...current, usesMonth }))
                  }
                />
                <ToggleRow
                  label="대상 학년 입력"
                  checked={form.usesGrade}
                  onCheckedChange={(usesGrade) =>
                    setForm((current) => ({ ...current, usesGrade }))
                  }
                />
                <ToggleRow
                  label="시험 회차 입력"
                  checked={form.usesRound}
                  onCheckedChange={(usesRound) =>
                    setForm((current) => ({ ...current, usesRound }))
                  }
                />
              </div>
            </Field>
            <div className="flex gap-2">
              {editingExam && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
              <Button
                className="flex-1"
                type="submit"
                disabled={saveMutation.isPending}
              >
                {editingExam ? '수정 저장' : '시험 추가'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" aria-hidden="true" />
            시험 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시험</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>시행 정보</TableHead>
                <TableHead>
                  <span className="sr-only">수정</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div className="font-medium">{exam.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exam.categories.map((category) => (
                        <Badge key={category.id} variant="secondary">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exam.usesMonth && <Badge variant="outline">월</Badge>}
                      {exam.usesGrade && <Badge variant="outline">학년</Badge>}
                      {exam.usesRound && <Badge variant="outline">회차</Badge>}
                      {!exam.usesMonth &&
                        !exam.usesGrade &&
                        !exam.usesRound && (
                          <span className="text-xs text-muted-foreground">
                            연도만
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEdit(exam)}
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
    </div>
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
    <label className="
      flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm
    ">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
