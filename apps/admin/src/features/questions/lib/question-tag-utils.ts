import type { Tag } from '@/shared/types';

export function getNextTagIds(
  currentTagIds: string[],
  selectedTag: Tag,
  tags: Tag[],
  checked: boolean,
) {
  if (!checked) {
    return currentTagIds.filter((tagId) => tagId !== selectedTag.id);
  }

  const selectedTagIds = new Set(currentTagIds);
  const tagGroup = selectedTag.tagGroup;
  if (tagGroup?.selectionMode === 'SINGLE') {
    tags
      .filter((tag) => tag.tagGroup?.id === tagGroup.id)
      .forEach((tag) => selectedTagIds.delete(tag.id));
  }

  selectedTagIds.add(selectedTag.id);
  return [...selectedTagIds];
}

export function mergeTags(...tagGroups: Tag[][]) {
  const tags = new Map<string, Tag>();
  tagGroups.flat().forEach((tag) => tags.set(tag.id, tag));
  return sortTags([...tags.values()]);
}

export function sortTags(tags: Tag[]) {
  return [...tags].sort(compareTags);
}

function compareTags(left: Tag, right: Tag) {
  return (
    (left.tagGroup?.sortOrder ?? 0) - (right.tagGroup?.sortOrder ?? 0) ||
    (left.tagGroup?.name ?? '').localeCompare(right.tagGroup?.name ?? '') ||
    left.sortOrder - right.sortOrder ||
    left.name.localeCompare(right.name)
  );
}
