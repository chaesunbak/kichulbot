'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kichulbot/ui/components/ui/chart';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  RecapTrendPoint,
  RecapWeaknessGroup,
} from '@/features/learning/lib/recap-stats';

interface RecapTrendSectionProps {
  data: RecapTrendPoint[];
  weaknessGroups: RecapWeaknessGroup[];
}

const accuracyChartConfig = {
  accuracyRate: {
    label: '정답률',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig;

const solvedCountChartConfig = {
  solvedCount: {
    label: '푼 문제수',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig;

const weaknessChartConfig = {
  weaknessRate: {
    label: '취약도',
    color: 'var(--color-chart-5)',
  },
  accuracyRate: {
    label: '정답률',
    color: 'var(--color-chart-3)',
  },
} satisfies ChartConfig;

export function RecapTrendSection({
  data,
  weaknessGroups,
}: RecapTrendSectionProps) {
  if (data.length === 0 && weaknessGroups.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>나의 학습 분석</CardTitle>
          <CardDescription>
            차트를 만들 풀이 기록이 아직 없습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="mt-6" aria-labelledby="recap-trend-title">
      <h2 id="recap-trend-title" className="text-lg font-semibold">
        나의 학습 분석
      </h2>
      {weaknessGroups.length > 0 && (
        <div
          className="
            mt-3 grid gap-4
            md:grid-cols-2
          "
        >
          {weaknessGroups.map((weaknessGroup) => (
            <WeaknessChartCard
              key={weaknessGroup.group.id}
              weaknessGroup={weaknessGroup}
            />
          ))}
        </div>
      )}
      {data.length > 0 && (
        <div
          className="
            mt-4 grid gap-4
            md:grid-cols-2
          "
        >
          <TrendChartCard
            title="정답률"
            description="날짜별 전체 문항 기준"
            data={data}
            config={accuracyChartConfig}
            dataKey="accuracyRate"
            unit="%"
            yDomain={[0, 100]}
          />
          <TrendChartCard
            title="푼 문제수"
            description="날짜별 제출 문항 수"
            data={data}
            config={solvedCountChartConfig}
            dataKey="solvedCount"
            unit="문제"
            allowDecimals={false}
          />
        </div>
      )}
    </section>
  );
}

interface TrendChartCardProps {
  title: string;
  description: string;
  data: RecapTrendPoint[];
  config: ChartConfig;
  dataKey: keyof Pick<RecapTrendPoint, 'accuracyRate' | 'solvedCount'>;
  unit: string;
  yDomain?: [number, number];
  allowDecimals?: boolean;
}

function TrendChartCard({
  title,
  description,
  data,
  config,
  dataKey,
  unit,
  yDomain,
  allowDecimals = true,
}: TrendChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-60 w-full"
          initialDimension={{ width: 420, height: 240 }}
        >
          <LineChart
            data={data}
            margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={18}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={34}
              domain={yDomain}
              allowDecimals={allowDecimals}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="date"
                  formatter={(value) => (
                    <span className="font-mono text-xs">
                      {formatTooltipValue(value, unit)}
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function WeaknessChartCard({
  weaknessGroup,
}: {
  weaknessGroup: RecapWeaknessGroup;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{weaknessGroup.group.name} 정답률</CardTitle>
        <CardDescription>태그별 전체 풀이 중 정답 비율</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={weaknessChartConfig}
          className="aspect-auto h-72 w-full"
          initialDimension={{ width: 420, height: 288 }}
        >
          <RadarChart
            data={weaknessGroup.tags}
            margin={{ top: 10, right: 32, bottom: 10, left: 32 }}
            accessibilityLayer
          >
            <PolarGrid gridType="polygon" radialLines />
            <PolarAngleAxis
              dataKey="tagName"
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={5}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="tagName"
                  formatter={(value, name, item) => {
                    const payload = item.payload as
                      | RecapWeaknessGroup['tags'][number]
                      | undefined;
                    return (
                      <span className="font-mono text-xs">
                        정답률 {formatTooltipValue(value, '%')}
                        {payload
                          ? ` (${payload.correctCount}/${payload.totalCount})`
                          : ''}
                      </span>
                    );
                  }}
                />
              }
            />
            <Radar
              dataKey="accuracyRate"
              fill="var(--color-accuracyRate)"
              fillOpacity={0.28}
              stroke="var(--color-accuracyRate)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function formatTooltipValue(value: unknown, unit: string) {
  if (typeof value !== 'number') return `- ${unit}`;
  return `${value.toLocaleString('ko-KR')} ${unit}`;
}
