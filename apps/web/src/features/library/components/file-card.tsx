import Link from 'next/link';

import type { LibraryPaper } from '@/features/learning/types';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { cn } from '@/shared/lib/utils';

type FileCardProps = {
  libraryPaper: LibraryPaper;
};

export function FileCard({ libraryPaper }: FileCardProps) {
  const { paper } = libraryPaper;

  return (
    <li>
      <Link
        href={`/library/papers/${libraryPaper.id}`}
        className={cn(
          `
            flex min-h-40 gap-5 rounded-2xl border p-5 transition
            hover:bg-zinc-50
          `,
          'md:min-h-56 md:flex-col md:gap-4',
        )}
        aria-label={`${paper.title} 자세히 보기`}
      >
        <PaperCover
          paper={paper}
          className="
            w-24 shrink-0
            md:mx-auto md:w-full md:max-w-32
          "
        />
        <div
          className="
            flex min-w-0 flex-1 flex-col
            md:flex-none
          "
        >
          <h3
            className="
              line-clamp-2 text-lg/tight font-medium break-keep text-zinc-950
              md:text-lg
            "
          >
            {paper.title}
          </h3>
          <p
            className="
              mt-1 truncate text-sm text-zinc-400
              md:text-sm
            "
          >
            {paper.exam.name}
          </p>
          <div
            className="
              mt-auto flex items-end justify-between gap-3 pt-6 text-sm
              text-zinc-400
              md:text-sm
            "
          >
            <span>{paper.questionCount} 문항</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  return `${Math.floor(diffMs / day)}일 전`;
}
