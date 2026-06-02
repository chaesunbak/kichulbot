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

export const CreateOfficialTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
  examId: z.string().min(1),
  tagGroupId: z.string().min(1).nullable().optional(),
});
export type CreateOfficialTagRequest = z.infer<
  typeof CreateOfficialTagRequestSchema
>;

export const UpdateOfficialTagRequestSchema =
  CreateOfficialTagRequestSchema.partial();
export type UpdateOfficialTagRequest = z.infer<
  typeof UpdateOfficialTagRequestSchema
>;

export const OfficialTagMutationResponseSchema = z.object({
  tag: AdminTagResponseSchema,
});
export type OfficialTagMutationResponse = z.infer<
  typeof OfficialTagMutationResponseSchema
>;

export const DeleteOfficialTagResponseSchema = z.object({
  id: z.string(),
});
export type DeleteOfficialTagResponse = z.infer<
  typeof DeleteOfficialTagResponseSchema
>;

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
