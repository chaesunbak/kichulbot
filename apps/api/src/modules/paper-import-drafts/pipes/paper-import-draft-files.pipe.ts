import type { PipeTransform } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

import { assertPdfUploadFile } from '../../../common/pipes/upload-file.pipe';
import type { UploadedMemoryFile } from '../../../infrastructure/storage/storage.service';

const PAPER_IMPORT_DRAFT_FILE_FIELDS = {
  questionPdf: '문제 PDF',
  answerPdf: '답지 PDF',
} as const;

type PaperImportDraftFileField = keyof typeof PAPER_IMPORT_DRAFT_FILE_FIELDS;

export type PaperImportDraftUploadedFiles = Partial<
  Record<PaperImportDraftFileField, UploadedMemoryFile[]>
>;

export type PaperImportDraftFiles = Partial<
  Record<PaperImportDraftFileField, UploadedMemoryFile>
>;

class PaperImportDraftFilesPipe implements PipeTransform<
  PaperImportDraftUploadedFiles | undefined,
  PaperImportDraftFiles
> {
  transform(value: PaperImportDraftUploadedFiles = {}) {
    this.assertAllowedFields(value);

    return {
      questionPdf: this.getSinglePdfFile(
        value.questionPdf,
        PAPER_IMPORT_DRAFT_FILE_FIELDS.questionPdf,
      ),
      answerPdf: this.getSinglePdfFile(
        value.answerPdf,
        PAPER_IMPORT_DRAFT_FILE_FIELDS.answerPdf,
      ),
    };
  }

  private assertAllowedFields(files: PaperImportDraftUploadedFiles) {
    const unexpectedField = Object.keys(files).find(
      (field) => !(field in PAPER_IMPORT_DRAFT_FILE_FIELDS),
    );

    if (unexpectedField) {
      throw new BadRequestException('지원하지 않는 업로드 필드입니다.');
    }
  }

  private getSinglePdfFile(files: UploadedMemoryFile[] = [], label: string) {
    if (files.length > 1) {
      throw new BadRequestException(`${label}는 1개만 업로드할 수 있습니다.`);
    }

    const file = files[0];
    if (file) {
      assertPdfUploadFile(file, label);
    }

    return file;
  }
}

export const PAPER_IMPORT_DRAFT_FILES_PIPE = new PaperImportDraftFilesPipe();
