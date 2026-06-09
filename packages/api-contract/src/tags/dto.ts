import * as z from 'zod';
import {
  AdminTagGroupResponseSchema,
  AdminTagResponseSchema,
  TagResponseSchema,
  TagSelectionModeSchema,
} from './schema.js';

export const ListTagsResponseSchema = z.object({
  tags: z.array(z.union([AdminTagResponseSchema, TagResponseSchema])),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;

export const CreateTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
  keywords: z.array(z.string().trim().min(1).max(50)).optional(),
  examId: z.string().min(1),
  tagGroupId: z.string().min(1).nullable().optional(),
});
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;

export const UpdateTagRequestSchema = CreateTagRequestSchema.partial();
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>;

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

export const CreateTagGroupRequestSchema = z.object({
  examId: z.string().min(1),
  name: z.string().trim().min(1).max(50),
  selectionMode: TagSelectionModeSchema,
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type CreateTagGroupRequest = z.infer<typeof CreateTagGroupRequestSchema>;

export const UpdateTagGroupRequestSchema =
  CreateTagGroupRequestSchema.partial();
export type UpdateTagGroupRequest = z.infer<typeof UpdateTagGroupRequestSchema>;

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
