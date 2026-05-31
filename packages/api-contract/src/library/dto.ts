import * as z from 'zod';
import {
  BookshelfResponseSchema,
  LibraryPaperResponseSchema,
} from './schema.js';

export const CreateBookshelfRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type CreateBookshelfRequest = z.infer<
  typeof CreateBookshelfRequestSchema
>;

export const UpdateBookshelfRequestSchema = CreateBookshelfRequestSchema;
export type UpdateBookshelfRequest = CreateBookshelfRequest;

export const BookshelfResponseEnvelopeSchema = z.object({
  bookshelf: BookshelfResponseSchema,
});
export type BookshelfResponseEnvelope = z.infer<
  typeof BookshelfResponseEnvelopeSchema
>;

export const ListBookshelvesResponseSchema = z.object({
  bookshelves: z.array(BookshelfResponseSchema),
});
export type ListBookshelvesResponse = z.infer<
  typeof ListBookshelvesResponseSchema
>;

export const DeleteBookshelfResponseSchema = z.object({
  id: z.string(),
});
export type DeleteBookshelfResponse = z.infer<
  typeof DeleteBookshelfResponseSchema
>;

export const AddLibraryPaperResponseSchema = z.object({
  libraryPaper: LibraryPaperResponseSchema,
});
export type AddLibraryPaperResponse = z.infer<
  typeof AddLibraryPaperResponseSchema
>;

export const DeleteLibraryPaperResponseSchema = z.object({
  bookshelfId: z.string(),
  paperId: z.string(),
});
export type DeleteLibraryPaperResponse = z.infer<
  typeof DeleteLibraryPaperResponseSchema
>;

export const ListLibraryPapersResponseSchema = z.object({
  libraryPapers: z.array(LibraryPaperResponseSchema),
});
export type ListLibraryPapersResponse = z.infer<
  typeof ListLibraryPapersResponseSchema
>;
