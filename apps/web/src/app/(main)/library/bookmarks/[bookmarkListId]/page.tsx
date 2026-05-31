import { notFound } from 'next/navigation';
import { BookmarkListDetail } from '@/components/bookmark-list-detail';
import { getBookmarkList, type BookmarkList } from '@/lib/learning';

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">문제 북마크</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
        {bookmarkList.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        저장한 문제 {bookmarkList.questionCount}개
      </p>
      <BookmarkListDetail initialList={bookmarkList} />
    </div>
  );
}
