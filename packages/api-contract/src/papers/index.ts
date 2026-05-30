import * as z from "zod";
import { IsoDateStringSchema } from "../common.js";
import { TaxonomyResponseSchema } from "../taxonomy/index.js";

export const CreatePaperRequestSchema = z.object({
  title: z.string().min(1).max(100),
  year: z.number().int().min(1994).max(2100),
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  questionCount: z.number().int().min(1).max(100).optional(),
  isPublished: z.boolean().optional(),
});
export type CreatePaperRequest = z.infer<typeof CreatePaperRequestSchema>;

export const QuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int(),
  answer: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const PaperResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  questionCount: z.number().int(),
  exam: TaxonomyResponseSchema,
  subject: TaxonomyResponseSchema,
});
export type PaperResponse = z.infer<typeof PaperResponseSchema>;

export const AdminPaperResponseSchema = PaperResponseSchema.extend({
  isPublished: z.boolean(),
  registeredQuestionCount: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
  questions: z.array(QuestionResponseSchema).optional(),
});
export type AdminPaperResponse = z.infer<typeof AdminPaperResponseSchema>;

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
