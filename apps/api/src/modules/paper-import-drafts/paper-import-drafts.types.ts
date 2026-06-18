import type {
  PaperImportDraftResponse,
  PaperImportJobResponse,
} from '@kichulbot/api-contract/papers';

import type { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';

export type CreateDraftInput = {
  questionPdf?: UploadedMemoryFile;
  answerPdf?: UploadedMemoryFile;
  options: Record<string, string | undefined>;
};

export type PaperImportJobRecord = {
  id: string;
  status: PaperImportJobResponse['job']['status'];
  questionPdfName: string;
  answerPdfName: string;
  paperId: string | null;
  paperInput: unknown;
  resultJsonPath: string | null;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
};

export type PaperImportJobItem = PaperImportJobResponse['job'];
export type PaperImportDraftPayload = PaperImportDraftResponse;
