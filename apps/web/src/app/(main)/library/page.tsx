import { LibraryManager } from '@/components/library-manager';
import { BookmarkListManager } from '@/components/bookmark-list-manager';
import { getBookmarkLists, getBookshelves } from '@/lib/learning';

export default async function LibraryPage() {
  const [bookshelves, bookmarkLists] = await Promise.all([
    getBookshelves(),
    getBookmarkLists(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">내책장</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">저장한 자료</h1>
      <p className="mt-2 text-sm text-zinc-500">
        자료를 책장별로 모아두고 이어서 학습하세요.
      </p>
      <LibraryManager initialBookshelves={bookshelves} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </div>
  );
}
