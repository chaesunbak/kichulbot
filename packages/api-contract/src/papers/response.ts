import * as z from 'zod';
import {
  BooleanInputSchema,
  GradingPolicySchema,
  QuestionTypeSchema,
} from '../common.js';
import {
  AdminPaperQuestionResponseSchema,
  AdminPaperResponseSchema,
  PaperImportDraftQuestionSchema,
  PaperImportJobExtractorOptionsSchema,
  PaperImportJobStatusSchema,
  PaperQuestionResponseSchema,
  PaperResponseSchema,
} from './dto.js';
import { CreatePaperImportJobRequestSchema } from './request.js';

export const CreatePaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});
export type CreatePaperResponse = z.infer<typeof CreatePaperResponseSchema>;

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

export const PaperImportJobPayloadResponseSchema = z.object({
  job: z.object({
    id: z.string(),
    questionPdfPath: z.string(),
    questionPdfName: z.string(),
    answerPdfPath: z.string(),
    inputOptions: PaperImportJobExtractorOptionsSchema,
    paperInput: CreatePaperImportJobRequestSchema,
  }),
});
export type PaperImportJobPayloadResponse = z.infer<
  typeof PaperImportJobPayloadResponseSchema
>;

export const CreatePaperImportJobResponseSchema = z.object({
  job: z.object({
    id: z.string(),
    status: PaperImportJobStatusSchema,
    paperId: z.string().nullable().optional(),
  }),
});
export type CreatePaperImportJobResponse = z.infer<
  typeof CreatePaperImportJobResponseSchema
>;

export const PaperImportJobResponseSchema = z.object({
  job: z.object({
    id: z.string(),
    status: PaperImportJobStatusSchema,
    questionPdfName: z.string().optional(),
    answerPdfName: z.string().optional(),
    paperTitle: z.string().optional(),
    paperId: z.string().nullable().optional(),
    errorMessage: z.string().nullable(),
    result: PaperImportDraftResponseSchema.nullable(),
    createdAt: z.string().optional(),
    startedAt: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    failedAt: z.string().nullable().optional(),
  }),
});
export type PaperImportJobResponse = z.infer<
  typeof PaperImportJobResponseSchema
>;

export const ListPaperImportJobsResponseSchema = z.object({
  jobs: z.array(PaperImportJobResponseSchema.shape.job),
});
export type ListPaperImportJobsResponse = z.infer<
  typeof ListPaperImportJobsResponseSchema
>;

export const UpdatePaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});
export type UpdatePaperResponse = z.infer<typeof UpdatePaperResponseSchema>;

export const DeletePaperResponseSchema = z.object({
  id: z.string(),
});
export type DeletePaperResponse = z.infer<typeof DeletePaperResponseSchema>;

export const AdminListPapersResponseSchema = z.object({
  papers: z.array(AdminPaperResponseSchema),
});
export type AdminListPapersResponse = z.infer<
  typeof AdminListPapersResponseSchema
>;

export const AdminGetPaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema.extend({
    questions: z.array(AdminPaperQuestionResponseSchema),
  }),
});
export type AdminGetPaperResponse = z.infer<typeof AdminGetPaperResponseSchema>;

export const PublicListPapersResponseSchema = z.object({
  papers: z.array(PaperResponseSchema),
});
export type PublicListPapersResponse = z.infer<
  typeof PublicListPapersResponseSchema
>;

export const PublicGetPaperResponseSchema = z.object({
  paper: PaperResponseSchema,
});
export type PublicGetPaperResponse = z.infer<
  typeof PublicGetPaperResponseSchema
>;

export const AdminListPaperQuestionsResponseSchema = z.object({
  paper: PaperResponseSchema,
  questions: z.array(PaperQuestionResponseSchema),
});
export type AdminListPaperQuestionsResponse = z.infer<
  typeof AdminListPaperQuestionsResponseSchema
>;

export const PublicListPaperQuestionsResponseSchema = z.object({
  paper: PaperResponseSchema,
  questions: z.array(PaperQuestionResponseSchema),
});
export type PublicListPaperQuestionsResponse = z.infer<
  typeof PublicListPaperQuestionsResponseSchema
>;
