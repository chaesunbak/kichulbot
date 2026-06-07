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
            hover:bg-muted
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
              line-clamp-2 text-lg/tight font-medium break-keep text-foreground
              md:text-lg
            "
          >
            {paper.title}
          </h3>
          <p
            className="
              mt-1 truncate text-sm text-muted-foreground
              md:text-sm
            "
          >
            {paper.exam.name}
          </p>
          <div
            className="
              mt-auto flex items-end justify-between gap-3 pt-6 text-sm
              text-muted-foreground
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
