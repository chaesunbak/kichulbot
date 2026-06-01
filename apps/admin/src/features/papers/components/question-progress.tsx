import { Badge } from '@kichulbot/ui/components/badge';
import { Card, CardContent } from '@kichulbot/ui/components/card';
import { Progress } from '@kichulbot/ui/components/progress';
import { CheckCircle2 } from 'lucide-react';

export function QuestionProgress({
  registered,
  total,
}: {
  registered: number;
  total: number;
}) {
  const isComplete = registered >= total;
  return (
    <Card className="mb-5">
      <CardContent className="py-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">문항 등록 진행률</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {registered}/{total}문항 등록
            </p>
          </div>
          {isComplete && (
            <Badge>
              <CheckCircle2 className="size-3" />
              등록 완료
            </Badge>
          )}
        </div>
        <Progress value={Math.min(100, (registered / total) * 100)} />
      </CardContent>
    </Card>
  );
}
