import * as z from 'zod';
import { AdminPaperResponseSchema, PaperResponseSchema } from './schema.js';

export const CreatePaperRequestSchema = z.object({
  title: z.string().min(1).max(100),
  year: z.number().int().min(1994).max(2100),
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  questionCount: z.number().int().min(1).max(100).optional(),
  isPublished: z.boolean().optional(),
});
export type CreatePaperRequest = z.infer<typeof CreatePaperRequestSchema>;

export const CreatePaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});
export type CreatePaperResponse = z.infer<typeof CreatePaperResponseSchema>;

export const ListPapersResponseSchema = z.object({
  papers: z.array(z.union([AdminPaperResponseSchema, PaperResponseSchema])),
});
export type ListPapersResponse = z.infer<typeof ListPapersResponseSchema>;

export const GetPaperResponseSchema = z.object({
  paper: z.union([AdminPaperResponseSchema, PaperResponseSchema]),
});
export type GetPaperResponse = z.infer<typeof GetPaperResponseSchema>;
