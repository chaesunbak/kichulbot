import * as z from 'zod';

export const MockExamInsufficientTagSchema = z.object({
  tagId: z.string(),
  tagName: z.string(),
  requiredCount: z.number().int().min(0),
  availableCount: z.number().int().min(0),
  selectedCount: z.number().int().min(0),
});
export type MockExamInsufficientTag = z.infer<
  typeof MockExamInsufficientTagSchema
>;

export const MockExamGenerationResponseSchema = z.object({
  supplemented: z.boolean(),
  insufficientTags: z.array(MockExamInsufficientTagSchema),
});
export type MockExamGenerationResponse = z.infer<
  typeof MockExamGenerationResponseSchema
>;
