import * as z from 'zod';
import { StudyWeeklyGoalResponseSchema } from './dto.js';

export const StudyWeeklyGoalResponseEnvelopeSchema = z.object({
  goal: StudyWeeklyGoalResponseSchema,
});
export type StudyWeeklyGoalResponseEnvelope = z.infer<
  typeof StudyWeeklyGoalResponseEnvelopeSchema
>;
