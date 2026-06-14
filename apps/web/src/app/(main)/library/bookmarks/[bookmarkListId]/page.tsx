import { notFound, redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import type { BookmarkList } from '@/features/learning/types';
import { getBookmarkList } from '@/features/library/api/server/queries';
import { BookmarkListDetail } from '@/features/library/components/bookmark-list-detail';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function BookmarkListPage({
  params,
}: {
  params: Promise<{ bookmarkListId: string }>;
}) {
  const { bookmarkListId } = await params;
  const user = await getUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/library/bookmarks/${bookmarkListId}`)}`,
    );
  }

  let bookmarkList: BookmarkList;
  try {
    bookmarkList = await getBookmarkList(bookmarkListId);
  } catch {
    notFound();
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-4">
        <PageTitle>{bookmarkList.name}</PageTitle>
        <div className="mt-2 text-sm text-muted-foreground">
          {bookmarkList.questionCount}개
        </div>
      </div>
      <BookmarkListDetail initialList={bookmarkList} />
    </PageContainer>
  );
}
