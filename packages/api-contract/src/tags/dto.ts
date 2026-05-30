import * as z from 'zod';
import { AdminTagResponseSchema, TagResponseSchema } from './schema.js';

export const ListTagsResponseSchema = z.object({
  tags: z.array(z.union([AdminTagResponseSchema, TagResponseSchema])),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;
