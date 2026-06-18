import { BooleanInputSchema } from '@kichulbot/api-contract';
import { createZodDto } from 'nestjs-zod';
import * as z from 'zod';

const REQUIRED_PAPER_FIELDS = ['title', 'year', 'examId'] as const;

export const CreatePaperBodySchema = z
  .strictObject({
    payload: z.string().min(1).optional(),
    title: z.string().min(1).max(100).optional(),
    year: z.coerce.number().int().min(1994).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).nullable().optional(),
    grade: z.coerce.number().int().min(1).max(3).nullable().optional(),
    round: z.coerce.number().int().min(1).nullable().optional(),
    examId: z.string().min(1).optional(),
    questionCount: z.coerce.number().int().min(1).max(100).optional(),
    isPublished: BooleanInputSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.payload) return;

    for (const field of REQUIRED_PAPER_FIELDS) {
      if (value[field] === undefined) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: '필수 입력값입니다.',
        });
      }
    }
  });

export class CreatePaperDto extends createZodDto(CreatePaperBodySchema) {}
