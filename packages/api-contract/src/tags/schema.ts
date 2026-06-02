import * as z from 'zod';
import { IsoDateStringSchema, OfficialTagKindSchema } from '../common.js';

export const TagSelectionModeSchema = z.enum(['SINGLE', 'MULTIPLE']);
export type TagSelectionMode = z.infer<typeof TagSelectionModeSchema>;

export const TagGroupResponseSchema = z.object({
  id: z.string(),
  examId: z.string(),
  name: z.string(),
  selectionMode: TagSelectionModeSchema,
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type TagGroupResponse = z.infer<typeof TagGroupResponseSchema>;

export const AdminTagGroupResponseSchema = TagGroupResponseSchema.extend({
  tagCount: z.number().int().min(0),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTagGroupResponse = z.infer<typeof AdminTagGroupResponseSchema>;

export const TagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: OfficialTagKindSchema,
  tagGroup: TagGroupResponseSchema.nullable().optional(),
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

export const AdminTagResponseSchema = TagResponseSchema.extend({
  examId: z.string(),
  tagGroupId: z.string().nullable(),
  questionCount: z.number().int().min(0),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTagResponse = z.infer<typeof AdminTagResponseSchema>;
