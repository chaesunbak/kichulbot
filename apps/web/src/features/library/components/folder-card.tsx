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
        type="button"
        className="
          flex min-h-40 w-full items-center gap-5 rounded-2xl border bg-card p-6
          text-left transition
          hover:border-sky-200 hover:bg-sky-50/40
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
            className="absolute top-2 left-1 h-5 w-10 rounded-t-xl bg-sky-400"
          />
          <span
            className="
              relative h-16 w-24 rounded-xl bg-sky-300 shadow-sm
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
              block truncate text-2xl font-semibold text-zinc-950
              md:text-xl
            "
          >
            {folder.name}
          </span>
          <span
            className="
              mt-4 block text-xl text-zinc-400
              md:text-lg
            "
          >
            {count}개
          </span>
        </span>
      </button>
    </li>
  );
}
