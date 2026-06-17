import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ConfigService } from '@nestjs/config';

import { LocalStorageService } from './local-storage.service';
import type { UploadedMemoryFile } from './storage.service';

function createConfigService(rootDir: string) {
  const values = new Map<string, string>([
    ['storage.local.dir', rootDir],
    ['storage.publicBaseUrl', 'http://localhost:4000/uploads/'],
  ]);

  return {
    get: jest.fn((key: string) => values.get(key)),
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

describe('LocalStorageService', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'kichulbot-local-storage-'));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('문제 이미지를 로컬 디렉터리에 저장하고 public URL을 반환한다', async () => {
    const service = new LocalStorageService(createConfigService(rootDir));

    await expect(
      service.uploadQuestionImage(createFile(), questionImagePathContext),
    ).resolves.toEqual({
      objectKey: 'questions/korean-history-advanced/78/001-question-id.png',
      url: 'http://localhost:4000/uploads/questions/korean-history-advanced/78/001-question-id.png',
    });

    await expect(
      readFile(
        join(
          rootDir,
          'questions/korean-history-advanced/78/001-question-id.png',
        ),
      ),
    ).resolves.toEqual(Buffer.from('test'));
  });

  it('object key로 public URL을 만든다', () => {
    const service = new LocalStorageService(createConfigService(rootDir));

    expect(service.getPublicUrl('questions/question-id.webp')).toBe(
      'http://localhost:4000/uploads/questions/question-id.webp',
    );
  });

  it('object key로 로컬 파일을 삭제한다', async () => {
    const service = new LocalStorageService(createConfigService(rootDir));
    const { objectKey } = await service.uploadQuestionImage(
      createFile(),
      questionImagePathContext,
    );

    await service.deleteObject(objectKey);

    await expect(stat(join(rootDir, objectKey))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('없는 로컬 파일 삭제 요청은 성공 처리한다', async () => {
    const service = new LocalStorageService(createConfigService(rootDir));

    await expect(
      service.deleteObject('questions/missing.png'),
    ).resolves.toBeUndefined();
  });

  it('허용하지 않는 이미지 형식을 거부한다', async () => {
    const service = new LocalStorageService(createConfigService(rootDir));

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
    const service = new LocalStorageService(createConfigService(rootDir));

    await expect(
      service.uploadQuestionImage(
        createFile({ size: 5 * 1024 * 1024 + 1 }),
        questionImagePathContext,
      ),
    ).rejects.toThrow('이미지 크기는 5MB 이하만 업로드할 수 있습니다.');
  });
});
