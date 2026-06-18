import type {
  AddBookmarkedQuestionResponse,
  BookmarkListResponseEnvelope,
  ListBookmarkListsResponse,
} from '@kichulbot/api-contract/bookmarks';

import type { BookmarksRepository } from './bookmarks.repository';

export type BookmarkedQuestionItem = AddBookmarkedQuestionResponse['question'];
export type BookmarkListPayload = BookmarkListResponseEnvelope['bookmarkList'];
export type BookmarkListSummaryItem =
  ListBookmarkListsResponse['bookmarkLists'][number];

export type BookmarkListSummaryRecord = Awaited<
  ReturnType<BookmarksRepository['findBookmarkLists']>
>[number];
export type BookmarkListRecord = NonNullable<
  Awaited<ReturnType<BookmarksRepository['findBookmarkList']>>
>;
export type BookmarkListQuestionRecord = BookmarkListRecord['items'][number];
