import * as z from 'zod';
import { BooleanInputSchema } from '../common.js';
import {
  AdminTagGroupResponseSchema,
  AdminTagResponseSchema,
  TagResponseSchema,
  TagSelectionModeSchema,
} from './dto.js';

export const CreateTagRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
  keywords: z.array(z.string().trim().min(1).max(50)).optional(),
  examId: z.string().min(1),
  tagGroupId: z.string().min(1).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;

export const UpdateTagRequestSchema = CreateTagRequestSchema.partial();
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>;

export const CreateTagGroupRequestSchema = z.strictObject({
  examId: z.string().min(1),
  name: z.string().trim().min(1).max(50),
  selectionMode: TagSelectionModeSchema,
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: BooleanInputSchema.optional(),
});
export type CreateTagGroupRequest = z.infer<typeof CreateTagGroupRequestSchema>;

export const UpdateTagGroupRequestSchema =
  CreateTagGroupRequestSchema.partial();
export type UpdateTagGroupRequest = z.infer<typeof UpdateTagGroupRequestSchema>;
