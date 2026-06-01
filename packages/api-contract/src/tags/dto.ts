import * as z from 'zod';
import { AdminTagResponseSchema, TagResponseSchema } from './schema.js';

export const ListTagsResponseSchema = z.object({
  tags: z.array(z.union([AdminTagResponseSchema, TagResponseSchema])),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;

export const CreateOfficialTagRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
  examIds: z.array(z.string().min(1)),
});
export type CreateOfficialTagRequest = z.infer<
  typeof CreateOfficialTagRequestSchema
>;

export const UpdateOfficialTagRequestSchema =
  CreateOfficialTagRequestSchema.partial().extend({
    isActive: z.boolean().optional(),
  });
export type UpdateOfficialTagRequest = z.infer<
  typeof UpdateOfficialTagRequestSchema
>;

export const OfficialTagMutationResponseSchema = z.object({
  tag: AdminTagResponseSchema,
});
export type OfficialTagMutationResponse = z.infer<
  typeof OfficialTagMutationResponseSchema
>;
