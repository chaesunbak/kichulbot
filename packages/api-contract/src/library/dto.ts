import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';
import { PaperResponseSchema } from '../papers/dto.js';

export const LibraryFolderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type LibraryFolderResponse = z.infer<typeof LibraryFolderResponseSchema>;

export const LibraryPaperResponseSchema = z.object({
  id: z.string(),
  folderId: z.string().nullable(),
  paper: PaperResponseSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type LibraryPaperResponse = z.infer<typeof LibraryPaperResponseSchema>;
