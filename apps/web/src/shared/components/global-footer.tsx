import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="h-40 border-t border-zinc-100 bg-white px-4 py-8 text-sm text-zinc-500">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-semibold text-zinc-700">
          기출봇
        </Link>
        <nav aria-label="푸터 메뉴" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terms" className="hover:text-zinc-900">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900">
            개인정보처리방침
          </Link>
        </nav>
      </div>
    </footer>
  );
}
