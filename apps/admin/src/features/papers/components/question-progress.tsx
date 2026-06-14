import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Card, CardContent } from '@kichulbot/ui/components/ui/card';
import { Progress } from '@kichulbot/ui/components/ui/progress';
import { CheckCircle2, Tag } from 'lucide-react';
import type { ReactNode } from 'react';

import { getPercentage } from '../lib/progress';

export function QuestionProgress({
  registered,
  tagged,
  total,
}: {
  registered: number;
  tagged: number;
  total: number;
}) {
  const isComplete = registered >= total;
  const isTagComplete = registered > 0 && tagged >= registered;
  const registrationPercentage = getPercentage(registered, total);
  const tagPercentage = getPercentage(tagged, registered);

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
        <div className="grid gap-4 md:grid-cols-2">
          <ProgressMetric
            label="문항 등록"
            value={`${registered}/${total}문항`}
            percentage={registrationPercentage}
          />
          <ProgressMetric
            label="태그 부착"
            value={`${tagged}/${registered}문항`}
            percentage={tagPercentage}
            badge={
              isTagComplete ? (
                <Badge variant="secondary">
                  <Tag className="size-3" />
                  태그 완료
                </Badge>
              ) : null
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressMetric({
  label,
  value,
  percentage,
  badge,
}: {
  label: string;
  value: string;
  percentage: number;
  badge?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {value} · {Math.round(percentage)}%
          </span>
          {badge}
        </div>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
