import {
  AddLibraryPaperRequestSchema,
  CreateLibraryFolderRequestSchema,
  MoveLibraryPaperRequestSchema,
  UpdateLibraryFolderRequestSchema,
} from '@kichulbot/api-contract/library';
import { createZodDto } from 'nestjs-zod';

export class CreateLibraryFolderDto extends createZodDto(
  CreateLibraryFolderRequestSchema,
) {}

export class UpdateLibraryFolderDto extends createZodDto(
  UpdateLibraryFolderRequestSchema,
) {}

export class AddLibraryPaperDto extends createZodDto(
  AddLibraryPaperRequestSchema,
) {}

export class MoveLibraryPaperDto extends createZodDto(
  MoveLibraryPaperRequestSchema,
) {}
