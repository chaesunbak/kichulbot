import * as z from 'zod';
import {
  LibraryFolderResponseSchema,
  LibraryPaperResponseSchema,
} from './dto.js';

export const LibraryResponseSchema = z.object({
  folders: z.array(LibraryFolderResponseSchema),
  papers: z.array(LibraryPaperResponseSchema),
});
export type LibraryResponse = z.infer<typeof LibraryResponseSchema>;

export const LibraryFolderResponseEnvelopeSchema = z.object({
  folder: LibraryFolderResponseSchema,
});
export type LibraryFolderResponseEnvelope = z.infer<
  typeof LibraryFolderResponseEnvelopeSchema
>;

export const DeleteLibraryFolderResponseSchema = z.object({
  id: z.string(),
});
export type DeleteLibraryFolderResponse = z.infer<
  typeof DeleteLibraryFolderResponseSchema
>;

export const LibraryPaperResponseEnvelopeSchema = z.object({
  libraryPaper: LibraryPaperResponseSchema,
});
export type LibraryPaperResponseEnvelope = z.infer<
  typeof LibraryPaperResponseEnvelopeSchema
>;

export const DeleteLibraryPaperResponseSchema = z.object({
  id: z.string(),
});
export type DeleteLibraryPaperResponse = z.infer<
  typeof DeleteLibraryPaperResponseSchema
>;
