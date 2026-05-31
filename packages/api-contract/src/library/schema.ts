import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';
import { PaperResponseSchema } from '../papers/schema.js';

export const LibraryPaperResponseSchema = z.object({
  paper: PaperResponseSchema,
  createdAt: IsoDateStringSchema,
});
export type LibraryPaperResponse = z.infer<typeof LibraryPaperResponseSchema>;

export const BookshelfResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  papers: z.array(LibraryPaperResponseSchema),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type BookshelfResponse = z.infer<typeof BookshelfResponseSchema>;
