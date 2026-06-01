import { getBookmarkLists, getLibrary } from '@/features/library/api/server';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { LibraryManager } from '@/features/library/components/library-manager';

export default async function LibraryPage() {
  const [library, bookmarkLists] = await Promise.all([
    getLibrary(),
    getBookmarkLists(),
  ]);

  return (
    <div
      className="
        mx-auto max-w-6xl px-4 py-8
        sm:px-6 sm:py-10
      "
    >
      <LibraryManager initialLibrary={library} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </div>
  );
}
