import { z } from "zod";
import { IsoDateStringSchema, TagCategorySchema } from "../common.js";

export const TagResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: TagCategorySchema,
});
export type TagResponse = z.infer<typeof TagResponseSchema>;

export const AdminTagResponseSchema = TagResponseSchema.extend({
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTagResponse = z.infer<typeof AdminTagResponseSchema>;

export const ListTagsResponseSchema = z.object({
  tags: z.array(z.union([AdminTagResponseSchema, TagResponseSchema])),
});
export type ListTagsResponse = z.infer<typeof ListTagsResponseSchema>;
