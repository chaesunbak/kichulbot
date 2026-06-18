import {
  SavePaperImportJobResultRequestSchema,
  UpdatePaperImportJobStatusRequestSchema,
} from '@kichulbot/api-contract/papers';
import { createZodDto } from 'nestjs-zod';

export class UpdatePaperImportJobStatusDto extends createZodDto(
  UpdatePaperImportJobStatusRequestSchema,
) {}

export class SavePaperImportJobResultDto extends createZodDto(
  SavePaperImportJobResultRequestSchema,
) {}
