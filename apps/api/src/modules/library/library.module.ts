import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LibraryController } from './library.controller';
import { LibraryRepository } from './library.repository';
import { LibraryService } from './library.service';

@Module({
  imports: [AuthModule],
  controllers: [LibraryController],
  providers: [LibraryService, LibraryRepository],
})
export class LibraryModule {}
