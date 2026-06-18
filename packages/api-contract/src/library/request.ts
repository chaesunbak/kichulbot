import * as z from 'zod';
import {
  LibraryFolderResponseSchema,
  LibraryPaperResponseSchema,
} from './dto.js';

export const CreateLibraryFolderRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
  parentId: z.string().nullable().optional(),
});
export type CreateLibraryFolderRequest = z.infer<
  typeof CreateLibraryFolderRequestSchema
>;

export const UpdateLibraryFolderRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50).optional(),
  parentId: z.string().nullable().optional(),
});
export type UpdateLibraryFolderRequest = z.infer<
  typeof UpdateLibraryFolderRequestSchema
>;

export const AddLibraryPaperRequestSchema = z.strictObject({
  folderId: z.string().nullable().optional(),
});
export type AddLibraryPaperRequest = z.infer<
  typeof AddLibraryPaperRequestSchema
>;

export const MoveLibraryPaperRequestSchema = z.strictObject({
  folderId: z.string().nullable(),
});
export type MoveLibraryPaperRequest = z.infer<
  typeof MoveLibraryPaperRequestSchema
>;
