import * as z from 'zod';
import {
  GradingPolicySchema,
  IsoDateStringSchema,
  QuestionTypeSchema,
  RecommendedTagMatchSchema,
} from '../common.js';
import { TagResponseSchema } from '../tags/dto.js';
import { TaxonomyResponseSchema } from '../taxonomy/dto.js';

export const QuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url(),
  imageCacheKey: z.string().min(1),
  choiceCount: z.number().int().nullable(),
  gradingPolicy: GradingPolicySchema,
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  explanation: z.string().nullable(),
  rawText: z.string().nullable(),
  promptText: z.string().nullable(),
  passageText: z.string().nullable(),
  choiceTexts: z.array(z.string()),
  points: z.number().int(),
  recommendedTimeSeconds: z.number().int().nullable(),
  recommendedTagIds: z.array(z.string()),
  recommendedTagMatches: z.array(RecommendedTagMatchSchema).default([]),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const AdminPaperQuestionResponseSchema = QuestionResponseSchema.extend({
  tags: z.array(TagResponseSchema).default([]),
});
export type AdminPaperQuestionResponse = z.infer<
  typeof AdminPaperQuestionResponseSchema
>;

export const PaperResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  month: z.number().int().nullable(),
  grade: z.number().int().nullable(),
  round: z.number().int().nullable(),
  questionCount: z.number().int(),
  isInLibrary: z.boolean(),
  exam: TaxonomyResponseSchema,
});
export type PaperResponse = z.infer<typeof PaperResponseSchema>;

export const PaperQuestionResponseSchema = z.object({
  id: z.string(),
  questionRevisionId: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url(),
  imageCacheKey: z.string().min(1),
  choiceCount: z.number().int().nullable(),
  gradingPolicy: GradingPolicySchema,
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  explanation: z.string().nullable(),
  rawText: z.string().nullable(),
  promptText: z.string().nullable(),
  passageText: z.string().nullable(),
  choiceTexts: z.array(z.string()),
  points: z.number().int(),
  recommendedTimeSeconds: z.number().int().nullable(),
  recommendedTagIds: z.array(z.string()),
  recommendedTagMatches: z.array(RecommendedTagMatchSchema).default([]),
  isBookmarked: z.boolean(),
});
export type PaperQuestionResponse = z.infer<typeof PaperQuestionResponseSchema>;

export const AdminPaperResponseSchema = PaperResponseSchema.extend({
  isPublished: z.boolean(),
  registeredQuestionCount: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
  questions: z.array(AdminPaperQuestionResponseSchema).optional(),
});
export type AdminPaperResponse = z.infer<typeof AdminPaperResponseSchema>;

export const CreatePaperQuestionRequestSchema = z.strictObject({
  number: z.coerce.number().int().min(1).max(100),
  type: QuestionTypeSchema.default('MULTIPLE_CHOICE'),
  choiceCount: z.coerce.number().int().min(2).max(10).nullable().optional(),
  gradingPolicy: GradingPolicySchema.default('EXACT'),
  answerChoice: z.coerce.number().int().min(1).max(10).nullable().optional(),
  answerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  rawText: z.string().nullable().optional(),
  promptText: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  choiceTexts: z.array(z.string()).default([]),
  points: z.coerce.number().int().min(1).max(100),
  recommendedTimeSeconds: z.coerce.number().int().min(1).nullable().optional(),
  recommendedTagIds: z.array(z.string()).default([]),
  recommendedTagMatches: z
    .array(
      z.strictObject({
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

export const PaperImportJobStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export type PaperImportJobStatus = z.infer<typeof PaperImportJobStatusSchema>;

export const PaperImportJobExtractorOptionsSchema = z.object({
  layout: z.string().optional(),
  variant: z.string().optional(),
  dpi: z.number().int().optional(),
  imageFormat: z.string().optional(),
  quality: z.number().int().optional(),
  examId: z.string().optional(),
});
export type PaperImportJobExtractorOptions = z.infer<
  typeof PaperImportJobExtractorOptionsSchema
>;
