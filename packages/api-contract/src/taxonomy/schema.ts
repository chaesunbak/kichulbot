import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const TaxonomyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type TaxonomyResponse = z.infer<typeof TaxonomyResponseSchema>;

export const AdminTaxonomyResponseSchema = TaxonomyResponseSchema.extend({
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTaxonomyResponse = z.infer<typeof AdminTaxonomyResponseSchema>;
