'use client';

import type { ReactNode } from 'react';

export function ResultSummarySection({
  score,
  accuracyRate,
  correctCount,
  totalCount,
  wrongCount,
  omittedCount,
  spentTime,
}: {
  score: number;
  accuracyRate: number;
  correctCount: number;
  totalCount: number;
  wrongCount: number;
  omittedCount: number;
  spentTime: string;
}) {
  return (
    <section
      className="
        grid grid-cols-2 gap-2.5
        lg:grid-cols-[1fr_1.45fr_1fr_1fr_1.15fr] lg:gap-0
        lg:overflow-hidden lg:rounded-lg lg:border lg:bg-card
      "
    >
      <ResultSummaryItem label="점수">
        <span className="text-xl/tight font-semibold text-zinc-800 lg:text-2xl/tight">
          {score}점
        </span>
        <span
          className="
            ml-1 text-xs text-zinc-400
            lg:text-sm
          "
        >
          /100점
        </span>
      </ResultSummaryItem>
      <ResultSummaryItem label="정답률">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="min-w-0">
            <div className="text-xl/tight font-bold text-zinc-800 lg:text-2xl/tight">
              {accuracyRate}%
            </div>
            <div className="mt-1 text-xs text-zinc-400 lg:text-sm">
              {correctCount} / {totalCount}문항
            </div>
          </div>
          <AccuracyRing value={accuracyRate} />
        </div>
      </ResultSummaryItem>
      <ResultSummaryItem label="오답">
        <span className="text-xl/tight font-bold text-destructive lg:text-2xl/tight">
          {wrongCount}
        </span>
        <span className="ml-1 text-sm font-semibold text-zinc-700 lg:text-base">
          문항
        </span>
      </ResultSummaryItem>
      <ResultSummaryItem label="미응답">
        <span className="text-xl/tight font-bold text-zinc-800 lg:text-2xl/tight">
          {omittedCount}
        </span>
        <span className="ml-1 text-sm font-semibold text-zinc-700 lg:text-base">
          문항
        </span>
      </ResultSummaryItem>
      <ResultSummaryItem
        label="총 풀이시간"
        className="col-span-2 min-h-16 lg:col-span-1 lg:min-h-26"
        inlineMobile
      >
        <span className="text-xl/tight font-bold text-zinc-800 lg:text-2xl/tight">
          {spentTime}
        </span>
      </ResultSummaryItem>
    </section>
  );
}

function ResultSummaryItem({
  label,
  className = '',
  inlineMobile = false,
  children,
}: {
  label: string;
  className?: string;
  inlineMobile?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`
        flex min-h-22 flex-col justify-center rounded-lg border bg-card
        px-4 py-3
        lg:min-h-26 lg:rounded-none lg:border-0 lg:border-r lg:px-6
        lg:last:border-r-0
        ${className}
      `}
    >
      <div
        className={
          inlineMobile
            ? `
              flex items-center justify-between gap-4
              lg:block
            `
            : ''
        }
      >
        <div
          className={`
            text-xs font-bold text-zinc-600 lg:text-sm
            ${inlineMobile ? 'lg:mb-3' : 'mb-2 lg:mb-3'}
          `}
        >
          {label}
        </div>
        <div className="flex items-baseline whitespace-nowrap">{children}</div>
      </div>
    </div>
  );
}

function AccuracyRing({ value }: { value: number }) {
  const normalizedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className="grid size-14 shrink-0 place-items-center rounded-full lg:size-14"
      style={{
        background: `conic-gradient(#ff6b6b ${normalizedValue}%, #e5e7eb 0)`,
      }}
      aria-label={`정답률 ${value}%`}
    >
      <div className="size-10.5 rounded-full bg-card lg:size-10" />
    </div>
  );
}
