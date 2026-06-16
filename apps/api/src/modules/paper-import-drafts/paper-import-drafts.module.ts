import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PapersModule } from '../papers/papers.module';
import { TagsModule } from '../tags/tags.module';
import { PaperImportDraftsController } from './paper-import-drafts.controller';
import { PaperImportDraftsService } from './paper-import-drafts.service';

@Module({
  imports: [AuthModule, PapersModule, TagsModule],
  controllers: [PaperImportDraftsController],
  providers: [PaperImportDraftsService],
})
export class PaperImportDraftsModule {}
