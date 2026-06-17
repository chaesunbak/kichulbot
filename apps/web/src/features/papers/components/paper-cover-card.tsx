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
  const palette = coverPalettes[hash(paper.id) % coverPalettes.length];
  const titleLines = getPaperCoverTitleLines(paper.title);

  return (
    <div
      className={cn(
        `
          @container relative mx-auto aspect-3/4 max-w-52 overflow-hidden
          rounded-sm border
        `,
        palette.cover,
        palette.border,
        className,
      )}
    >
      <div className="relative flex h-full flex-col">
        <div
          className="
            flex flex-1 flex-col items-center justify-center px-2 pt-5
            text-center
          "
        >
          <p
            className={cn(
              `
                mt-1 max-w-full text-[clamp(0.5rem,8.5cqw,1.5rem)] leading-[1.15]
                font-black text-balance wrap-break-word
              `,
              palette.ink,
            )}
          >
            {titleLines.map((line, index) => (
              <span
                key={`${line}-${index}`}
                className={cn(
                  'block',
                  titleLines.length > 1 && 'whitespace-nowrap',
                )}
              >
                {line}
              </span>
            ))}
          </p>
        </div>
        <div
          className={cn(
            `
              relative z-10 border-t border-current/15 bg-card/20 p-2
              text-center text-[clamp(0.625rem,6cqw,0.95rem)] font-extrabold
              text-balance wrap-break-word
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

export function getPaperCoverTitleLines(title: string) {
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const titleMatch = /^(제\d+회)\s+(.+)\s+(심화|기본)$/u.exec(normalizedTitle);

  if (!titleMatch) {
    return [title];
  }

  return [titleMatch[1], titleMatch[2], titleMatch[3]];
}

function hash(value: string) {
  return [...value].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
}
