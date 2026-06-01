import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="border-t border-zinc-100 bg-white px-4 py-8 text-sm text-zinc-500 h-40">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-semibold text-zinc-700">
          기출봇
        </Link>
      </div>
    </footer>
  );
}
