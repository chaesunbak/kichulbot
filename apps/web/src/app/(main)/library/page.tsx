import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import {
  getBookmarkLists,
  getLibrary,
} from '@/features/library/api/server/queries';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { LibraryManager } from '@/features/library/components/library-manager';
import { PageContainer } from '@/shared/components/page-container';

export default async function LibraryPage() {
  const [user, library, bookmarkLists] = await Promise.all([
    getUser(),
    getLibrary(),
    getBookmarkLists(),
  ]);
  if (!user) redirect('/login?next=/library');

  return (
    <PageContainer>
      <LibraryManager initialLibrary={library} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </PageContainer>
  );
}
