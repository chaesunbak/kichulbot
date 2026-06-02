import type { LibraryFolder } from '@/features/learning/types';

type FolderCardProps = {
  folder: LibraryFolder;
  count: number;
  onOpen: () => void;
};

export function FolderCard({ folder, count, onOpen }: FolderCardProps) {
  return (
    <li>
      <button
        className="
          flex size-full min-h-40 items-center gap-5 rounded-2xl border bg-card
          p-6 text-left
          md:min-h-56 md:flex-col md:items-center md:justify-center
          md:text-center
        "
        onClick={onOpen}
      >
        <span
          className="
            relative flex h-20 w-24 shrink-0 items-end
            md:h-24 md:w-32
          "
        >
          <span
            className="absolute top-2 left-0.5 h-5 w-10 rounded-t-lg bg-sky-300"
          />
          <span
            className="
              relative h-16 w-24 rounded-lg bg-sky-200
              md:h-20 md:w-32
            "
          />
        </span>
        <span
          className="
            min-w-0 flex-1
            md:flex-none
          "
        >
          <span
            className="
              line-clamp-2 text-lg/tight font-medium break-keep text-zinc-950
              md:text-lg
            "
          >
            {folder.name}
          </span>
          <span
            className="
              mt-3 truncate text-sm text-zinc-400
              md:text-sm
            "
          >
            {count}개
          </span>
        </span>
      </button>
    </li>
  );
}
