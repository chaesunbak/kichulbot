import * as z from 'zod';
import { GradingPolicySchema, QuestionTypeSchema } from '../common.js';
import {
  AdminPaperResponseSchema,
  PaperQuestionResponseSchema,
  PaperResponseSchema,
} from './schema.js';

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
  gradingPolicy: GradingPolicySchema.default('EXACT'),
  answerChoice: z.number().int().min(1).max(10).nullable().optional(),
  answerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  rawText: z.string().nullable().optional(),
  promptText: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  choiceTexts: z.array(z.string()).default([]),
  points: z.number().int().min(1).max(100),
  recommendedTimeSeconds: z.number().int().min(1).nullable().optional(),
  recommendedTagIds: z.array(z.string()).default([]),
  recommendedTagMatches: z
    .array(
      z.object({
        tagId: z.string().min(1),
        keywords: z.array(z.string().trim().min(1)),
      }),
    )
    .default([]),
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

export const CreatePaperImportJobRequestSchema =
  CreatePaperRequestSchema.extend({
    layout: z.string().min(1).default('korean-history'),
    variant: z.string().min(1).default('odd'),
    dpi: z.number().int().min(72).max(600).optional(),
    imageFormat: z.string().min(1).default('webp'),
    quality: z.number().int().min(1).max(100).optional(),
  });
export type CreatePaperImportJobRequest = z.infer<
  typeof CreatePaperImportJobRequestSchema
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

export const PaperImportDraftQuestionTextLayerSchema = z.object({
  text: z.string(),
  promptText: z.string().optional(),
  passageText: z.string().optional(),
  choiceTexts: z.array(z.string()).default([]),
  lines: z.array(
    z.object({
      text: z.string(),
      box: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    }),
  ),
});
export type PaperImportDraftQuestionTextLayer = z.infer<
  typeof PaperImportDraftQuestionTextLayerSchema
>;

export const PaperImportDraftQuestionSchema = z.object({
  number: z.number().int(),
  type: QuestionTypeSchema,
  choiceCount: z.number().int().nullable(),
  gradingPolicy: GradingPolicySchema.default('EXACT'),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  explanation: z.string().nullable(),
  rawText: z.string().nullable().optional(),
  promptText: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  choiceTexts: z.array(z.string()).default([]),
  points: z.number().int(),
  recommendedTimeSeconds: z.number().int().nullable(),
  recommendedTagIds: z.array(z.string()).default([]),
  recommendedTagMatches: z
    .array(
      z.object({
        tagId: z.string(),
        keywords: z.array(z.string()),
      }),
    )
    .default([]),
  tagIds: z.array(z.string()),
  image: PaperImportDraftImageSchema,
  textLayer: PaperImportDraftQuestionTextLayerSchema.nullable().optional(),
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

export const PaperImportJobStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export type PaperImportJobStatus = z.infer<typeof PaperImportJobStatusSchema>;

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

export const UpdatePaperRequestSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    year: z.number().int().min(1994).max(2100).optional(),
    round: z.number().int().min(1).nullable().optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '수정할 문제지 정보를 입력해 주세요.',
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

export const ListPaperQuestionsResponseSchema = z.object({
  paper: PaperResponseSchema,
  questions: z.array(PaperQuestionResponseSchema),
});
export type ListPaperQuestionsResponse = z.infer<
  typeof ListPaperQuestionsResponseSchema
>;
