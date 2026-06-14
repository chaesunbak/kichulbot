import type { AdminPaperResponse } from '@kichulbot/api-contract/papers';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/ui/table';
import { Link } from 'react-router';

import { formatPaperSession } from '../lib/paper-metadata';

export function PapersTable({ papers }: { papers: AdminPaperResponse[] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>시험</TableHead>
            <TableHead>연도</TableHead>
            <TableHead>문항</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>
              <span className="sr-only">상세</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {papers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                등록된 문제지가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            papers.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell className="min-w-56 font-medium">
                  {paper.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {paper.exam.name}
                </TableCell>
                <TableCell>{formatPaperSession(paper)}</TableCell>
                <TableCell>
                  {paper.registeredQuestionCount ?? 0}/{paper.questionCount}
                </TableCell>
                <TableCell>
                  <Badge variant={paper.isPublished ? 'default' : 'secondary'}>
                    {paper.isPublished ? '공개' : '비공개'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/papers/${paper.id}`}>상세</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
