import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  type QuestionImagePathContext,
  StorageService,
  type StoredObject,
  type UploadedMemoryFile,
} from './storage.service';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class S3StorageService extends StorageService {
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly client: S3Client;

  constructor(configService: ConfigService) {
    super();

    this.bucket = configService.getOrThrow<string>('storage.r2.bucket');
    this.publicBaseUrl = configService
      .getOrThrow<string>('storage.r2.publicBaseUrl')
      .replace(/\/+$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: configService.getOrThrow<string>('storage.r2.endpoint'),
      credentials: {
        accessKeyId: configService.getOrThrow<string>('storage.r2.accessKeyId'),
        secretAccessKey: configService.getOrThrow<string>(
          'storage.r2.secretAccessKey',
        ),
      },
    });
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

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { objectKey, url: this.getPublicUrl(objectKey) };
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
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
    const objectId = context.imageObjectId ?? context.questionId;

    return [
      'questions',
      context.examSlug,
      context.paperSlug,
      `${questionNumber}-${objectId}.${extension}`,
    ].join('/');
  }
}
