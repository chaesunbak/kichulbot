'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';
import type { Paper } from '@/features/papers/types';

interface PaperGridProps {
  papers: Paper[];
  source?: string;
  resultCount?: number;
}

export function PaperGrid({
  papers,
  source = 'resources',
  resultCount = papers.length,
}: PaperGridProps) {
  if (papers.length === 0) {
    return (
      <section className="rounded-lg border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          조건에 맞는 시험지가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <ul
      className="
        grid grid-cols-2 gap-x-3 gap-y-7
        sm:grid-cols-3 sm:gap-x-5
        lg:grid-cols-4
      "
    >
      {papers.map((paper, index) => {
        const labels = getPaperGridLabels(paper);

        return (
          <li key={paper.id} className="min-w-0">
            <Link
              href={`/resources/${paper.id}`}
              className="
                group block rounded-lg p-2 transition
                hover:bg-muted
              "
              aria-label={`${paper.title} 자세히 보기`}
              onClick={() => {
                posthog.capture('paper_clicked', {
                  paper_id: paper.id,
                  exam_id: paper.exam.id,
                  source,
                  index,
                  result_count: resultCount,
                });
              }}
            >
              <PaperCover paper={paper} />
              <div className="mt-3 text-center">
                <p
                  className="
                    text-sm font-medium text-balance text-foreground
                    sm:text-sm
                  "
                >
                  <span className="sm:hidden">{labels.compactTitle}</span>
                  <span className="hidden sm:inline">{labels.title}</span>
                </p>
                <p
                  className="
                    mt-1 truncate text-xs text-muted-foreground
                    sm:text-xs
                  "
                >
                  <span className="sm:hidden">{labels.compactMeta}</span>
                  <span className="hidden sm:inline">{labels.meta}</span>
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function getPaperGridLabels(paper: Paper) {
  const sessionLabel = formatPaperSession(paper);
  const titleMatch = /^(제\d+회)\s+(.+)\s+(심화|기본)$/u.exec(
    paper.title.trim().replace(/\s+/g, ' '),
  );

  if (!titleMatch) {
    return {
      title: paper.title,
      compactTitle: paper.title,
      meta: `${paper.exam.name} · ${sessionLabel}`,
      compactMeta: paper.exam.name,
    };
  }

  const [, session, examName, level] = titleMatch;

  return {
    title: paper.title,
    compactTitle: `${session} ${level}`,
    meta: `${paper.exam.name} · ${sessionLabel}`,
    compactMeta: examName,
  };
}
