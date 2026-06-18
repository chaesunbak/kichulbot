import type {
  ListTagGroupsResponse,
  PublicListTagsResponse,
  TagMutationResponse,
} from '@kichulbot/api-contract/tags';

import type {
  Tag,
  TagGroup,
} from '../../infrastructure/database/prisma-client';

export type AdminTagItem = TagMutationResponse['tag'];
export type TagItem = PublicListTagsResponse['tags'][number];
export type AdminTagGroupItem = ListTagGroupsResponse['tagGroups'][number];
export type TagGroupItem = NonNullable<AdminTagItem['tagGroup']>;

export type TagRecord = Tag & {
  tagGroup?: TagGroup | null;
  _count?: { questions: number };
};

export type TagGroupRecord = TagGroup & {
  _count?: { tags: number };
};

export type RecommendedTagTextInput = {
  text?: string | null;
  promptText?: string | null;
  passageText?: string | null;
  choiceTexts?: string[] | null;
};
