import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';

import { S3StorageService } from './s3-storage.service';
import type { UploadedMemoryFile } from './storage.service';

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();

  return {
    DeleteObjectCommand: jest.fn((input) => ({ input, type: 'delete' })),
    PutObjectCommand: jest.fn((input) => ({ input, type: 'put' })),
    S3Client: jest.fn(() => ({ send })),
  };
});

function createConfigService() {
  const values = new Map<string, string>([
    ['storage.r2.endpoint', 'https://account-id.r2.cloudflarestorage.com'],
    ['storage.r2.accessKeyId', 'access-key'],
    ['storage.r2.secretAccessKey', 'secret-key'],
    ['storage.r2.bucket', 'kichulbot'],
    ['storage.r2.publicBaseUrl', 'https://cdn.example.com/uploads/'],
  ]);

  return {
    getOrThrow: jest.fn((key: string) => values.get(key)),
  } as unknown as ConfigService;
}

function createFile(
  overrides: Partial<UploadedMemoryFile> = {},
): UploadedMemoryFile {
  return {
    originalname: 'question.png',
    mimetype: 'image/png',
    size: 4,
    buffer: Buffer.from('test'),
    ...overrides,
  };
}

const questionImagePathContext = {
  questionId: 'question-id',
  examSlug: 'korean-history-advanced',
  paperSlug: '78',
  questionNumber: 1,
};

describe('S3StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(S3Client)
      .mockImplementation(() => ({ send: jest.fn() }) as never);
  });

  it('문제 이미지를 R2에 업로드하고 public URL을 반환한다', async () => {
    const service = new S3StorageService(createConfigService());

    await expect(
      service.uploadQuestionImage(createFile(), questionImagePathContext),
    ).resolves.toEqual({
      objectKey: 'questions/korean-history-advanced/78/001-question-id.png',
      url: 'https://cdn.example.com/uploads/questions/korean-history-advanced/78/001-question-id.png',
    });

    const client = jest.mocked(S3Client).mock.results[0].value as {
      send: jest.Mock;
    };

    expect(S3Client).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://account-id.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'access-key',
        secretAccessKey: 'secret-key',
      },
    });
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'kichulbot',
      Key: 'questions/korean-history-advanced/78/001-question-id.png',
      Body: Buffer.from('test'),
      ContentType: 'image/png',
    });
    expect(client.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'put' }),
    );
  });

  it('object key로 public URL을 만든다', () => {
    const service = new S3StorageService(createConfigService());

    expect(service.getPublicUrl('questions/question-id.webp')).toBe(
      'https://cdn.example.com/uploads/questions/question-id.webp',
    );
  });

  it('object key로 R2 객체를 삭제한다', async () => {
    const service = new S3StorageService(createConfigService());

    await service.deleteObject('questions/question-id.png');

    const client = jest.mocked(S3Client).mock.results[0].value as {
      send: jest.Mock;
    };

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: 'kichulbot',
      Key: 'questions/question-id.png',
    });
    expect(client.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'delete' }),
    );
  });

  it('허용하지 않는 이미지 형식을 거부한다', async () => {
    const service = new S3StorageService(createConfigService());

    await expect(
      service.uploadQuestionImage(
        createFile({ mimetype: 'image/gif' }),
        questionImagePathContext,
      ),
    ).rejects.toThrow(
      'png, jpg, jpeg, webp 형식의 이미지만 업로드할 수 있습니다.',
    );
  });

  it('5MB를 초과한 이미지를 거부한다', async () => {
    const service = new S3StorageService(createConfigService());

    await expect(
      service.uploadQuestionImage(
        createFile({ size: 5 * 1024 * 1024 + 1 }),
        questionImagePathContext,
      ),
    ).rejects.toThrow('이미지 크기는 5MB 이하만 업로드할 수 있습니다.');
  });
});
