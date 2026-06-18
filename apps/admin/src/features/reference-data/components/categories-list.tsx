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
import { FolderTree, Pencil, Trash2 } from 'lucide-react';

import { type AdminTaxonomy } from '@/shared/types';

interface CategoriesListProps {
  categories: AdminTaxonomy[];
  deletingCategoryId?: string | null;
  onEdit: (category: AdminTaxonomy) => void;
  onDelete: (category: AdminTaxonomy) => void;
}

export function CategoriesList({
  categories,
  deletingCategoryId,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  return (
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
            {categories.map((category) => {
              const isDeleting = deletingCategoryId === category.id;

              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(category)}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => onDelete(category)}
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
