import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import {
  getBookmarkLists,
  getLibrary,
} from '@/features/library/api/server/queries';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { LibraryManager } from '@/features/library/components/library-manager';
import { PageContainer } from '@/shared/components/page-container';

export default async function LibraryPage() {
  let data: Awaited<ReturnType<typeof loadLibraryPageData>>;
  try {
    data = await loadLibraryPageData();
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/library');
    throw error;
  }

  return (
    <PageContainer>
      <LibraryManager initialLibrary={data.library} />
      <BookmarkListManager initialBookmarkLists={data.bookmarkLists} />
    </PageContainer>
  );
}

async function loadLibraryPageData() {
  const [library, bookmarkLists] = await Promise.all([
    getLibrary(),
    getBookmarkLists(),
  ]);
  return { library, bookmarkLists };
}
