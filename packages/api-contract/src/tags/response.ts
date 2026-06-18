import * as z from 'zod';
import { BooleanInputSchema } from '../common.js';
import {
  AdminTagGroupResponseSchema,
  AdminTagResponseSchema,
  TagResponseSchema,
  TagSelectionModeSchema,
} from './dto.js';

export const AdminListTagsResponseSchema = z.object({
  tags: z.array(AdminTagResponseSchema),
});
export type AdminListTagsResponse = z.infer<typeof AdminListTagsResponseSchema>;

export const PublicListTagsResponseSchema = z.object({
  tags: z.array(TagResponseSchema),
});
export type PublicListTagsResponse = z.infer<
  typeof PublicListTagsResponseSchema
>;

export const TagMutationResponseSchema = z.object({
  tag: AdminTagResponseSchema,
});
export type TagMutationResponse = z.infer<typeof TagMutationResponseSchema>;

export const DeleteTagResponseSchema = z.object({
  id: z.string(),
});
export type DeleteTagResponse = z.infer<typeof DeleteTagResponseSchema>;

export const ListTagGroupsResponseSchema = z.object({
  tagGroups: z.array(AdminTagGroupResponseSchema),
});
export type ListTagGroupsResponse = z.infer<typeof ListTagGroupsResponseSchema>;

export const TagGroupMutationResponseSchema = z.object({
  tagGroup: AdminTagGroupResponseSchema,
});
export type TagGroupMutationResponse = z.infer<
  typeof TagGroupMutationResponseSchema
>;

export const DeleteTagGroupResponseSchema = z.object({
  id: z.string(),
});
export type DeleteTagGroupResponse = z.infer<
  typeof DeleteTagGroupResponseSchema
>;
