import * as z from 'zod';
import { IsoDateStringSchema, OfficialTagKindSchema } from '../common.js';

export const TagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: OfficialTagKindSchema,
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

export const AdminTagResponseSchema = TagResponseSchema.extend({
  examId: z.string(),
  questionCount: z.number().int().min(0),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTagResponse = z.infer<typeof AdminTagResponseSchema>;
