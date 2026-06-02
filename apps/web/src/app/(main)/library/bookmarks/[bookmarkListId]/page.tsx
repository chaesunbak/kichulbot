import { notFound } from 'next/navigation';

import type { BookmarkList } from '@/features/learning/types';
import { getBookmarkList } from '@/features/library/api/server';
import { BookmarkListDetail } from '@/features/library/components/bookmark-list-detail';
import { PageContainer } from '@/shared/components/page-container';

export default async function BookmarkListPage({
  params,
}: {
  params: Promise<{ bookmarkListId: string }>;
}) {
  const { bookmarkListId } = await params;
  let bookmarkList: BookmarkList;
  try {
    bookmarkList = await getBookmarkList(bookmarkListId);
  } catch {
    notFound();
  }

  return (
    <PageContainer className="max-w-5xl">
      <div className="flex items-center gap-4">
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          {bookmarkList.name}
        </h1>
        <div className="mt-2 text-sm text-zinc-500">
          {bookmarkList.questionCount}개
        </div>
      </div>
      <BookmarkListDetail initialList={bookmarkList} />
    </PageContainer>
  );
}
