import { LibraryManager } from '@/components/library-manager';
import { BookmarkListManager } from '@/components/bookmark-list-manager';
import { getBookmarkLists, getBookshelves } from '@/lib/learning';

export default async function LibraryPage() {
  const [bookshelves, bookmarkLists] = await Promise.all([
    getBookshelves(),
    getBookmarkLists(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">내 서재</h1>

      <LibraryManager initialBookshelves={bookshelves} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </div>
  );
}
