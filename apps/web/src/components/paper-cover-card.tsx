import { BookCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPaperSession } from '@/lib/paper-labels';
import type { Paper } from '@/lib/papers';

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

export function PaperCoverCard({ paper }: { paper: Paper }) {
  const palette =
    coverPalettes[hash(paper.subject.slug) % coverPalettes.length];

  return (
    <div>
      <div className="mx-auto max-w-52">
        <div
          className={cn(
            'relative aspect-3/4 overflow-hidden rounded-lg border',
            palette.cover,
            palette.border,
          )}
        >
          {paper.isInLibrary && (
            <span
              className="absolute right-2 top-8 flex size-6 items-center justify-center rounded-full bg-white/65"
              aria-label="내서재에 저장됨"
              title="내서재에 저장됨"
            >
              <BookCheck className="size-3.5" />
            </span>
          )}
          <div className="relative flex h-full flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-3 pt-5 text-center">
              <p
                className={cn(
                  'text-[11px] font-bold sm:text-xs',
                  palette.accent,
                )}
              >
                {formatPaperSession(paper)}
              </p>
              <p
                className={cn(
                  'mt-1 break-keep text-xl font-black tracking-[-0.08em] sm:text-2xl',
                  palette.ink,
                )}
              >
                {paper.exam.name}
              </p>
              <p
                className={cn(
                  'mt-1 text-sm font-extrabold sm:text-base',
                  palette.ink,
                )}
              >
                기출문제
              </p>
            </div>
            <div
              className={cn(
                'relative z-10 border-y border-current/15 bg-white/20 px-2 py-2 text-center text-xs font-extrabold sm:text-sm',
                palette.accent,
              )}
            >
              {paper.subject.name}
            </div>
          </div>
        </div>
      </div>
      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 break-keep text-sm font-bold leading-5 text-zinc-900  sm:text-base">
          {paper.title}
        </h3>
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
