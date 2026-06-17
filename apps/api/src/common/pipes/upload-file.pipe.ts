import { BadRequestException, ParseFilePipeBuilder } from '@nestjs/common';

import type { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';

const IMAGE_FILE_TYPE = /image\/(png|jpeg|webp)/;
const PDF_FILE_TYPE = /application\/pdf/;

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const PDF_MAX_FILE_SIZE = 30 * 1024 * 1024;

export const IMAGE_UPLOAD_OPTIONS = {
  limits: { fileSize: IMAGE_MAX_FILE_SIZE },
};

export const PDF_UPLOAD_OPTIONS = {
  limits: { fileSize: PDF_MAX_FILE_SIZE, files: 2 },
};

export function assertPdfUploadFile(file: UploadedMemoryFile, label: string) {
  if (file.size > PDF_MAX_FILE_SIZE) {
    throw new BadRequestException(
      `${label} 크기는 30MB 이하만 업로드할 수 있습니다.`,
    );
  }

  if (!PDF_FILE_TYPE.test(file.mimetype)) {
    throw new BadRequestException(
      `${label}는 PDF 파일만 업로드할 수 있습니다.`,
    );
  }
}

export const IMAGE_FILE_PIPE = new ParseFilePipeBuilder()
  .addMaxSizeValidator({
    maxSize: IMAGE_MAX_FILE_SIZE,
    message: '이미지 크기는 5MB 이하만 업로드할 수 있습니다.',
  })
  .addFileTypeValidator({ fileType: IMAGE_FILE_TYPE })
  .build({ fileIsRequired: false });
