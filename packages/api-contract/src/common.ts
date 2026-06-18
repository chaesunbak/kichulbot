import * as z from 'zod';

export const IsoDateStringSchema = z.iso.datetime();

export const UserRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SignupMethodSchema = z.enum(['EMAIL', 'KAKAO']);
export type SignupMethod = z.infer<typeof SignupMethodSchema>;

export const AuthMethodSchema = z.enum(['EMAIL', 'KAKAO']);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

export const OAuthProviderSchema = z.enum(['KAKAO']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const QuestionTypeSchema = z.enum(['MULTIPLE_CHOICE', 'WRITTEN']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const GradingPolicySchema = z.enum(['EXACT', 'ANY_CHOICE']);
export type GradingPolicy = z.infer<typeof GradingPolicySchema>;

export const RecommendedTagMatchSchema = z.object({
  tagId: z.string(),
  keywords: z.array(z.string()),
});
export type RecommendedTagMatch = z.infer<typeof RecommendedTagMatchSchema>;

export const AnswerModeSchema = z.enum(['ONE_BY_ONE', 'EXAM']);
export type AnswerMode = z.infer<typeof AnswerModeSchema>;

export const BooleanInputSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (['true', '1'].includes(normalized)) return true;
  if (['false', '0'].includes(normalized)) return false;

  return value;
}, z.boolean());

export const createStringArrayInputSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const raw = Array.isArray(value) ? value : [value];

    return raw
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }, z.array(itemSchema).optional());

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    statusCode: z.number(),
    message: z.union([z.string(), z.array(z.string())]),
    error: z.string().optional(),
    path: z.string(),
    timestamp: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export const PaginationQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
