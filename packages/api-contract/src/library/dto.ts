import * as z from 'zod';
import {
  LibraryFolderResponseSchema,
  LibraryPaperResponseSchema,
} from './schema.js';

export const LibraryResponseSchema = z.object({
  folders: z.array(LibraryFolderResponseSchema),
  papers: z.array(LibraryPaperResponseSchema),
});
export type LibraryResponse = z.infer<typeof LibraryResponseSchema>;

export const CreateLibraryFolderRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
  parentId: z.string().nullable().optional(),
});
export type CreateLibraryFolderRequest = z.infer<
  typeof CreateLibraryFolderRequestSchema
>;

export const UpdateLibraryFolderRequestSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  parentId: z.string().nullable().optional(),
});
export type UpdateLibraryFolderRequest = z.infer<
  typeof UpdateLibraryFolderRequestSchema
>;

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

export const AddLibraryPaperRequestSchema = z.object({
  folderId: z.string().nullable().optional(),
});
export type AddLibraryPaperRequest = z.infer<
  typeof AddLibraryPaperRequestSchema
>;

export const MoveLibraryPaperRequestSchema = z.object({
  folderId: z.string().nullable(),
});
export type MoveLibraryPaperRequest = z.infer<
  typeof MoveLibraryPaperRequestSchema
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
