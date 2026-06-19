import * as z from 'zod';

export const StudyStreakResponseSchema = z.object({
  currentStreakDays: z.number().int().nonnegative(),
});
export type StudyStreakResponse = z.infer<typeof StudyStreakResponseSchema>;

export const StudyTimeResponseSchema = z.object({
  date: z.iso.date(),
  spentMilliseconds: z.number().int().nonnegative(),
});
export type StudyTimeResponse = z.infer<typeof StudyTimeResponseSchema>;

export const ActiveUsersResponseSchema = z.object({
  date: z.iso.date(),
  activeUserCount: z.number().int().nonnegative(),
});
export type ActiveUsersResponse = z.infer<typeof ActiveUsersResponseSchema>;
