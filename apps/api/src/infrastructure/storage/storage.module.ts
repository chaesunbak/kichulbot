import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const driver = configService.get<string>('storage.driver') ?? 'local';

        return driver === 'r2'
          ? new S3StorageService(configService)
          : new LocalStorageService(configService);
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
