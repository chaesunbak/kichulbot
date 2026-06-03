import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getBookmarkLists, getLibrary } from '@/features/library/api/server';
import { BookmarkListManager } from '@/features/library/components/bookmark-list-manager';
import { LibraryManager } from '@/features/library/components/library-manager';
import { PageContainer } from '@/shared/components/page-container';

export default async function LibraryPage() {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/library');

  const [library, bookmarkLists] = await Promise.all([
    getLibrary(),
    getBookmarkLists(),
  ]);

  return (
    <PageContainer>
      <LibraryManager initialLibrary={library} />
      <BookmarkListManager initialBookmarkLists={bookmarkLists} />
    </PageContainer>
  );
}
