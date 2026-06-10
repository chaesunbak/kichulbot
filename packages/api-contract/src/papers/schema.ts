import * as z from 'zod';
import {
  GradingPolicySchema,
  IsoDateStringSchema,
  QuestionTypeSchema,
  RecommendedTagMatchSchema,
} from '../common.js';
import { TagResponseSchema } from '../tags/schema.js';
import { TaxonomyResponseSchema } from '../taxonomy/schema.js';

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
