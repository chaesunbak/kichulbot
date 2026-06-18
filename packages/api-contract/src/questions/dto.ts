import * as z from 'zod';
import {
  GradingPolicySchema,
  IsoDateStringSchema,
  QuestionTypeSchema,
  RecommendedTagMatchSchema,
} from '../common.js';
import { TagResponseSchema } from '../tags/dto.js';

export const AdminQuestionResponseSchema = z.object({
  id: z.string(),
  paperId: z.string(),
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
  tags: z.array(TagResponseSchema),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminQuestionResponse = z.infer<typeof AdminQuestionResponseSchema>;
