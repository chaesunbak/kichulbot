import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  QuestionImagePathContext,
  StorageService,
  StoredObject,
  UploadedMemoryFile,
} from './storage.service';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(configService: ConfigService) {
    super();
    this.rootDir =
      configService.get<string>('storage.local.dir') ??
      join(process.cwd(), 'uploads');
    this.publicBaseUrl = (
      configService.get<string>('storage.publicBaseUrl') ??
      'http://localhost:4000/uploads'
    ).replace(/\/+$/, '');
  }

  async uploadQuestionImage(
    file: UploadedMemoryFile,
    context: QuestionImagePathContext,
  ): Promise<StoredObject> {
    const extension = this.resolveExtension(file);

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        '이미지 크기는 5MB 이하만 업로드할 수 있습니다.',
      );
    }

    const objectKey = this.createQuestionImageObjectKey(context, extension);
    const fullPath = join(this.rootDir, objectKey);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.buffer);

    return { objectKey, url: this.getPublicUrl(objectKey) };
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  async deleteObject(objectKey: string): Promise<void> {
    try {
      await unlink(join(this.rootDir, objectKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveExtension(file: UploadedMemoryFile): string {
    const extension = MIME_TO_EXTENSION[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        'png, jpg, jpeg, webp 형식의 이미지만 업로드할 수 있습니다.',
      );
    }
    return extension;
  }

  private createQuestionImageObjectKey(
    context: QuestionImagePathContext,
    extension: string,
  ) {
    const questionNumber = context.questionNumber.toString().padStart(3, '0');

    return [
      'questions',
      context.examSlug,
      context.paperSlug,
      `${questionNumber}-${context.questionId}.${extension}`,
    ].join('/');
  }
}
