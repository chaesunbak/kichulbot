import type { Paper } from '@/features/papers/types';
import { cn } from '@/shared/lib/utils';

const coverPalettes = [
  {
    cover: 'bg-[#f6e7b0]',
    border: 'border-[#e4cc7c]',
    ink: 'text-[#694e22]',
    accent: 'text-[#9d762b]',
  },
  {
    cover: 'bg-[#dcefd6]',
    border: 'border-[#bdd9b6]',
    ink: 'text-[#355c39]',
    accent: 'text-[#5d8b60]',
  },
  {
    cover: 'bg-[#f4dddd]',
    border: 'border-[#e5c0bd]',
    ink: 'text-[#70403d]',
    accent: 'text-[#b25d58]',
  },
  {
    cover: 'bg-[#e8e0f3]',
    border: 'border-[#d0c2e3]',
    ink: 'text-[#594273]',
    accent: 'text-[#80629e]',
  },
  {
    cover: 'bg-[#dcebf1]',
    border: 'border-[#bdd7e0]',
    ink: 'text-[#355f6e]',
    accent: 'text-[#56889a]',
  },
  {
    cover: 'bg-[#f3e0cb]',
    border: 'border-[#e2c4a5]',
    ink: 'text-[#765236]',
    accent: 'text-[#a87951]',
  },
] as const;

export function PaperCover({
  paper,
  className,
}: {
  paper: Paper;
  className?: string;
}) {
  const palette = coverPalettes[hash(paper.exam.id) % coverPalettes.length];

  return (
    <div
      className={cn(
        'relative aspect-3/4 overflow-hidden rounded-lg border',
        palette.cover,
        palette.border,
        className,
      )}
    >
      <div className="relative flex h-full flex-col">
        <div
          className="
            flex flex-1 flex-col items-center justify-center px-3 pt-5
            text-center
          "
        >
          <p
            className={cn(
              `
                mt-1 text-xl font-black break-keep
                sm:text-2xl
              `,
              palette.ink,
            )}
          >
            {paper.title}
          </p>
        </div>
        <div
          className={cn(
            `
              relative z-10 border-y border-current/15 bg-card/20 p-2
              text-center text-xs font-extrabold
              sm:text-sm
            `,
            palette.accent,
          )}
        >
          {paper.exam.name}
        </div>
      </div>
    </div>
  );
}

export function PaperCoverCard({ paper }: { paper: Paper }) {
  return (
    <div>
      <div className="mx-auto max-w-52">
        <PaperCover paper={paper} />
      </div>
    </div>
  );
}

function hash(value: string) {
  return [...value].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
}
