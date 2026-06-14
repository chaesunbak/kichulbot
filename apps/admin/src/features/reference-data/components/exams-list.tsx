import { type AdminExamResponse } from '@kichulbot/api-contract/taxonomy';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
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
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';

export interface ExamsListProps {
  exams: AdminExamResponse[];
  deletingExamId?: string | null;
  onEdit: (exam: AdminExamResponse) => void;
  onDelete: (exam: AdminExamResponse) => void;
}

export function ExamsList({
  exams,
  deletingExamId,
  onEdit,
  onDelete,
}: ExamsListProps) {
  return (
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
              <TableHead>문제지</TableHead>
              <TableHead>
                <span className="sr-only">관리</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => {
              const hasPapers = exam.paperCount > 0;
              const isDeleting = deletingExamId === exam.id;

              return (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div className="font-medium">{exam.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {exam.slug}
                    </div>
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
                      {exam.usesRound && <Badge variant="outline">회차</Badge>}
                      {exam.isMockExamAvailable && (
                        <Badge variant="secondary">모의고사</Badge>
                      )}
                      {!exam.usesMonth && !exam.usesRound && (
                        <span className="text-xs text-muted-foreground">
                          연도만
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{exam.paperCount}개</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(exam)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={hasPapers || isDeleting}
                        title={
                          hasPapers
                            ? '연결된 문제지가 있어 삭제할 수 없습니다.'
                            : undefined
                        }
                        onClick={() => onDelete(exam)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
