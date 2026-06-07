import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { StorageModule } from './storage.module';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  S3Client: jest.fn(() => ({ send: jest.fn() })),
}));

function createConfigService(driver: 'local' | 'r2') {
  const values = new Map<string, string>([
    ['storage.driver', driver],
    ['storage.local.dir', '/tmp/uploads'],
    ['storage.publicBaseUrl', 'http://localhost:4000/uploads'],
  ]);

  if (driver === 'r2') {
    values.set(
      'storage.r2.endpoint',
      'https://account-id.r2.cloudflarestorage.com',
    );
    values.set('storage.r2.accessKeyId', 'access-key');
    values.set('storage.r2.secretAccessKey', 'secret-key');
    values.set('storage.r2.bucket', 'kichulbot');
    values.set('storage.r2.publicBaseUrl', 'https://cdn.example.com/uploads');
  }

  return {
    get: jest.fn((key: string) => values.get(key)),
    getOrThrow: jest.fn((key: string) => values.get(key)),
  };
}

describe('StorageModule', () => {
  it('STORAGE_DRIVER가 local이면 로컬 어댑터를 주입한다', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule],
    })
      .overrideProvider(ConfigService)
      .useValue(createConfigService('local'))
      .compile();

    expect(moduleRef.get(StorageService)).toBeInstanceOf(LocalStorageService);
  });

  it('STORAGE_DRIVER가 r2이면 R2 어댑터를 주입한다', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule],
    })
      .overrideProvider(ConfigService)
      .useValue(createConfigService('r2'))
      .compile();

    expect(moduleRef.get(StorageService)).toBeInstanceOf(S3StorageService);
  });
});
