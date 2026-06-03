import type { AdminTagResponse } from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/ui/table';
import { Pencil, Tags, Trash2 } from 'lucide-react';

import { type Taxonomy } from '@/shared/types';

export interface TagListPanelProps {
  tags: AdminTagResponse[];
  selectedExam: Taxonomy | null;
  isLoading: boolean;
  deletingTagId?: string | null;
  onEdit: (tag: AdminTagResponse) => void;
  onDelete: (tag: AdminTagResponse) => void;
}

export function TagListPanel({
  tags,
  selectedExam,
  isLoading,
  deletingTagId,
  onEdit,
  onDelete,
}: TagListPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tags className="size-4" aria-hidden="true" />
          공식 태그 목록
        </CardTitle>
        <CardDescription>
          {selectedExam
            ? `${selectedExam.name}에 등록된 공식 태그입니다.`
            : '시험을 선택하면 등록된 공식 태그를 볼 수 있습니다.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>태그</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>문항</TableHead>
              <TableHead>
                <span className="sr-only">관리</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => {
              const questionCount = tag.questionCount ?? 0;
              const hasQuestions = questionCount > 0;
              const isDeleting = deletingTagId === tag.id;

              return (
                <TableRow key={tag.id}>
                  <TableCell>
                    <div className="font-medium">{tag.name}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {tag.tagGroup?.name ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{questionCount}개</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(tag)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={hasQuestions || isDeleting}
                        title={
                          hasQuestions
                            ? '문항에 연결된 태그는 삭제할 수 없습니다.'
                            : undefined
                        }
                        onClick={() => onDelete(tag)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {tags.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  {isLoading
                    ? '태그를 불러오는 중입니다.'
                    : '아직 등록된 태그가 없습니다.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
