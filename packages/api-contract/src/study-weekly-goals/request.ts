import * as z from 'zod';

export const UpdateStudyWeeklyGoalRequestSchema = z.strictObject({
  targetDays: z.number().int().min(1).max(7),
});
export type UpdateStudyWeeklyGoalRequest = z.infer<
  typeof UpdateStudyWeeklyGoalRequestSchema
>;
