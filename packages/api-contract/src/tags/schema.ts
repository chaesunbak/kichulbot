import * as z from 'zod';
import { IsoDateStringSchema, OfficialTagKindSchema } from '../common.js';

export const TagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: OfficialTagKindSchema,
  isActive: z.boolean(),
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

export const AdminTagResponseSchema = TagResponseSchema.extend({
  examIds: z.array(z.string()),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTagResponse = z.infer<typeof AdminTagResponseSchema>;
