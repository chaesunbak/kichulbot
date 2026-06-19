import * as z from 'zod';

export const StudyDateQuerySchema = z.strictObject({
  date: z.iso.date().optional(),
});
export type StudyDateQuery = z.infer<typeof StudyDateQuerySchema>;

export const StudyTimeQuerySchema = StudyDateQuerySchema;
export type StudyTimeQuery = StudyDateQuery;

export const ActiveUsersQuerySchema = StudyDateQuerySchema;
export type ActiveUsersQuery = StudyDateQuery;
