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
        <p className="text-sm text-zinc-500">조건에 맞는 시험지가 없습니다.</p>
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
      {papers.map((paper, index) => (
        <li key={paper.id} className="min-w-0">
          <Link
            href={`/resources/${paper.id}`}
            className="
              group block rounded-lg p-2 transition
              hover:bg-zinc-50
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
              <p className="text-sm font-medium text-zinc-900">{paper.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {paper.exam.name} · {formatPaperSession(paper)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
