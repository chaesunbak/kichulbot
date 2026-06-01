import type { AdminTagResponse } from '@kichulbot/api-contract/tags';
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
import { Switch } from '@kichulbot/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Tags } from 'lucide-react';
import * as React from 'react';

import type { Taxonomy } from '@/shared/api/api-client';

import {
  type TagForm,
  useSaveTagMutation,
  useUpdateTagActiveMutation,
} from '../mutations';
import { adminTagsQueryOptions } from '../queries';

const EMPTY_FORM: TagForm = { name: '', examIds: [] };

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

  const tagsQuery = useQuery(adminTagsQueryOptions(token));

  function resetForm() {
    setEditingTag(null);
    setForm(EMPTY_FORM);
  }

  const saveMutation = useSaveTagMutation(
    token,
    editingTag?.id ?? null,
    resetForm,
  );
  const activeMutation = useUpdateTagActiveMutation(token);

  function beginEdit(tag: AdminTagResponse) {
    setEditingTag(tag);
    setForm({
      name: tag.name,
      examIds: tag.examIds,
    });
  }

  function toggleExam(examId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      examIds: checked
        ? [...current.examIds, examId]
        : current.examIds.filter((id) => id !== examId),
    }));
  }

  const tags = (tagsQuery.data?.tags ?? []) as AdminTagResponse[];

  return (
    <div className="
      mx-auto grid max-w-7xl gap-5 px-5 py-6
      lg:grid-cols-[minmax(320px,420px)_1fr]
    ">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" aria-hidden="true" />
            {editingTag ? '공식 태그 수정' : '공식 태그 추가'}
          </CardTitle>
          <CardDescription>
            시험별로 문항 편집에 노출할 공식 태그를 관리합니다.
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
              <FieldLabel htmlFor="tag-name">태그 이름</FieldLabel>
              <Input
                id="tag-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="조선"
              />
            </Field>
            <Field>
              <FieldLabel>적용 시험</FieldLabel>
              <div className="grid gap-2">
                {exams.map((exam) => (
                  <label
                    key={exam.id}
                    className="
                      flex cursor-pointer items-center gap-2 rounded-md border
                      px-3 py-2 text-sm
                    "
                  >
                    <Checkbox
                      checked={form.examIds.includes(exam.id)}
                      onCheckedChange={(checked) =>
                        toggleExam(exam.id, checked === true)
                      }
                    />
                    {exam.name}
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex gap-2">
              {editingTag && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
              <Button
                className="flex-1"
                type="submit"
                disabled={saveMutation.isPending}
              >
                {editingTag ? '수정 저장' : '태그 추가'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4" aria-hidden="true" />
            공식 태그 목록
          </CardTitle>
          <CardDescription>
            비활성화해도 기존 문항 연결은 유지되며 새 지정만 막힙니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>태그</TableHead>
                <TableHead>적용 시험</TableHead>
                <TableHead>활성</TableHead>
                <TableHead>
                  <span className="sr-only">수정</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="font-medium">{tag.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tag.examIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          없음
                        </span>
                      ) : (
                        tag.examIds.map((examId) => (
                          <Badge key={examId} variant="outline">
                            {exams.find((exam) => exam.id === examId)?.name ??
                              examId}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={tag.isActive}
                      disabled={activeMutation.isPending}
                      onCheckedChange={(isActive) =>
                        activeMutation.mutate({ tagId: tag.id, isActive })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEdit(tag)}
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
