import * as z from 'zod';
import { QuestionTypeSchema } from '../common.js';
import { AdminPaperResponseSchema, PaperResponseSchema } from './schema.js';

export const CreatePaperRequestSchema = z.object({
  title: z.string().min(1).max(100),
  year: z.number().int().min(1994).max(2100),
  month: z.number().int().min(1).max(12).nullable().optional(),
  grade: z.number().int().min(1).max(3).nullable().optional(),
  round: z.number().int().min(1).nullable().optional(),
  examId: z.string().min(1),
  questionCount: z.number().int().min(1).max(100).optional(),
  isPublished: z.boolean().optional(),
});
export type CreatePaperRequest = z.infer<typeof CreatePaperRequestSchema>;

export const CreatePaperQuestionRequestSchema = z.object({
  number: z.number().int().min(1).max(100),
  type: QuestionTypeSchema.default('MULTIPLE_CHOICE'),
  choiceCount: z.number().int().min(2).max(10).nullable().optional(),
  answerChoice: z.number().int().min(1).max(10).nullable().optional(),
  answerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  points: z.number().int().min(1).max(100),
  recommendedTimeSeconds: z.number().int().min(1).nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  imageFileName: z.string().min(1),
});
export type CreatePaperQuestionRequest = z.infer<
  typeof CreatePaperQuestionRequestSchema
>;

export const CreatePaperWithQuestionsRequestSchema = z.object({
  paper: CreatePaperRequestSchema,
  questions: z.array(CreatePaperQuestionRequestSchema).min(1).max(100),
});
export type CreatePaperWithQuestionsRequest = z.infer<
  typeof CreatePaperWithQuestionsRequestSchema
>;

export const CreatePaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});
export type CreatePaperResponse = z.infer<typeof CreatePaperResponseSchema>;

export const PaperImportDraftImageSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  base64: z.string(),
});
export type PaperImportDraftImage = z.infer<typeof PaperImportDraftImageSchema>;

export const PaperImportDraftQuestionSchema = z.object({
  number: z.number().int(),
  type: QuestionTypeSchema,
  choiceCount: z.number().int().nullable(),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  explanation: z.string().nullable(),
  points: z.number().int(),
  recommendedTimeSeconds: z.number().int().nullable(),
  tagIds: z.array(z.string()),
  image: PaperImportDraftImageSchema,
});
export type PaperImportDraftQuestion = z.infer<
  typeof PaperImportDraftQuestionSchema
>;

export const PaperImportDraftResponseSchema = z.object({
  paperSuggestion: z
    .object({
      title: z.string().optional(),
      questionCount: z.number().int().optional(),
    })
    .default({}),
  warnings: z.array(z.string()),
  questions: z.array(PaperImportDraftQuestionSchema),
});
export type PaperImportDraftResponse = z.infer<
  typeof PaperImportDraftResponseSchema
>;

export const UpdatePaperRequestSchema = z.object({
  isPublished: z.boolean(),
});
export type UpdatePaperRequest = z.infer<typeof UpdatePaperRequestSchema>;

export const UpdatePaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});
export type UpdatePaperResponse = z.infer<typeof UpdatePaperResponseSchema>;

export const DeletePaperResponseSchema = z.object({
  id: z.string(),
});
export type DeletePaperResponse = z.infer<typeof DeletePaperResponseSchema>;

export const ListPapersQuerySchema = z.object({
  examId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
});
export type ListPapersQuery = z.infer<typeof ListPapersQuerySchema>;

export const ListPapersResponseSchema = z.object({
  papers: z.array(z.union([AdminPaperResponseSchema, PaperResponseSchema])),
});
export type ListPapersResponse = z.infer<typeof ListPapersResponseSchema>;

export const GetPaperResponseSchema = z.object({
  paper: z.union([AdminPaperResponseSchema, PaperResponseSchema]),
});
export type GetPaperResponse = z.infer<typeof GetPaperResponseSchema>;
