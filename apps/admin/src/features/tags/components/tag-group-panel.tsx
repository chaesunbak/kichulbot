import type {
  AdminTagGroupResponse,
  TagSelectionMode,
} from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Field, FieldLabel } from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { Switch } from '@kichulbot/ui/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/ui/table';
import { Layers3, Pencil, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import type { Taxonomy } from '@/shared/types';

import type { TagGroupForm } from '../mutations';

interface TagGroupPanelProps {
  selectedExam: Taxonomy | null;
  tagGroups: AdminTagGroupResponse[];
  editingTagGroup: AdminTagGroupResponse | null;
  form: TagGroupForm;
  isLoading: boolean;
  isSubmitting: boolean;
  deletingTagGroupId?: string | null;
  onEdit: (tagGroup: AdminTagGroupResponse) => void;
  onDelete: (tagGroup: AdminTagGroupResponse) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onFormChange: React.Dispatch<React.SetStateAction<TagGroupForm>>;
}

export function TagGroupPanel({
  selectedExam,
  tagGroups,
  editingTagGroup,
  form,
  isLoading,
  isSubmitting,
  deletingTagGroupId,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
  onFormChange,
}: TagGroupPanelProps) {
  return (
    <div
      className="
        grid gap-5
        lg:grid-cols-[1fr_minmax(320px,420px)]
      "
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers3 className="size-4" aria-hidden="true" />
            태그 그룹
          </CardTitle>
          <CardDescription>
            {selectedExam
              ? `${selectedExam.name}의 분석 기준 그룹입니다.`
              : '시험을 선택하면 그룹을 볼 수 있습니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>방식</TableHead>
                <TableHead>태그</TableHead>
                <TableHead>
                  <span className="sr-only">관리</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tagGroups.map((tagGroup) => {
                const hasTags = tagGroup.tagCount > 0;
                const isDeleting = deletingTagGroupId === tagGroup.id;

                return (
                  <TableRow key={tagGroup.id}>
                    <TableCell>
                      <div className="font-medium">{tagGroup.name}</div>
                      {!tagGroup.isActive && (
                        <div className="text-xs text-muted-foreground">
                          비활성
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {tagGroup.selectionMode === 'SINGLE' ? '단일' : '다중'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{tagGroup.tagCount}개</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(tagGroup)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={hasTags || isDeleting}
                          title={
                            hasTags
                              ? '태그가 연결된 그룹은 삭제할 수 없습니다.'
                              : undefined
                          }
                          onClick={() => onDelete(tagGroup)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tagGroups.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    {isLoading
                      ? '태그 그룹을 불러오는 중입니다.'
                      : '아직 등록된 태그 그룹이 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" aria-hidden="true" />
            {editingTagGroup ? '그룹 수정' : '그룹 추가'}
          </CardTitle>
          <CardDescription>
            분석 차트에서 태그를 묶어 보여줄 기준입니다.
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
              <FieldLabel htmlFor="tag-group-name">그룹 이름</FieldLabel>
              <Input
                id="tag-group-name"
                value={form.name}
                placeholder="시대"
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>선택 방식</FieldLabel>
              <Select
                value={form.selectionMode}
                onValueChange={(value) =>
                  onFormChange((current) => ({
                    ...current,
                    selectionMode: value as TagSelectionMode,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">단일 선택</SelectItem>
                  <SelectItem value="MULTIPLE">다중 선택</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="tag-group-sort">정렬 순서</FieldLabel>
              <Input
                id="tag-group-sort"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  onFormChange((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field
              className="
                flex flex-row items-center justify-between rounded-md border
                px-3 py-2
              "
            >
              <FieldLabel htmlFor="tag-group-active">활성</FieldLabel>
              <Switch
                id="tag-group-active"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  onFormChange((current) => ({
                    ...current,
                    isActive: checked,
                  }))
                }
              />
            </Field>
            <div className="flex gap-2">
              {editingTagGroup && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  취소
                </Button>
              )}
              <Button className="flex-1" type="submit" disabled={isSubmitting}>
                {editingTagGroup ? '수정 저장' : '그룹 추가'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
