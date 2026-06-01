import { LibraryManager } from '@/features/library/components/library-manager';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { getBookmarkLists, getLibrary } from '@/features/learning/api';

export default async function LibraryPage() {
  const [library, bookmarkLists] = await Promise.all([
    getLibrary(),
    getBookmarkLists(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="mt-1 text-2xl font-semibold text-gray-800">내 서재</h1>

      <LibraryManager initialLibrary={library} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </div>
  );
}
