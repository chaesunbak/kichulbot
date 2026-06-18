import * as z from 'zod';

export const StudyWeeklyGoalResponseSchema = z.object({
  targetDays: z.number().int().min(1).max(7),
  effectiveWeekStartDate: z.iso.date(),
  currentWeekStartDate: z.iso.date(),
  isConfigured: z.boolean(),
});
export type StudyWeeklyGoalResponse = z.infer<
  typeof StudyWeeklyGoalResponseSchema
>;
