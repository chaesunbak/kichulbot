import type { CreatePaperInput } from './api';
import type { PaperValues } from './schemas';

export function toCreatePaperInput(values: PaperValues): CreatePaperInput {
  return {
    ...values,
    isPublished: values.isPublished === 'true',
  };
}
