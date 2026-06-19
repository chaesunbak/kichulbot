import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import {
  getBookmarkLists,
  getLibrary,
} from '@/features/library/api/server/queries';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { LibraryManager } from '@/features/library/components/library-manager';
import { PageContainer } from '@/shared/components/page-container';

export default async function LibraryPage() {
  let library: Awaited<ReturnType<typeof getLibrary>>;
  let bookmarkLists: Awaited<ReturnType<typeof getBookmarkLists>>;
  try {
    [library, bookmarkLists] = await Promise.all([
      getLibrary(),
      getBookmarkLists(),
    ]);
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/library');
    throw error;
  }

  return (
    <PageContainer>
      <LibraryManager initialLibrary={library} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </PageContainer>
  );
}
