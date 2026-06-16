import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PapersModule } from '../papers/papers.module';
import { TagsModule } from '../tags/tags.module';
import { PaperImportDraftsController } from './paper-import-drafts.controller';
import { PaperImportDraftsService } from './paper-import-drafts.service';
import { PaperImportJobsController } from './paper-import-jobs.controller';

@Module({
  imports: [AuthModule, PapersModule, TagsModule],
  controllers: [PaperImportDraftsController, PaperImportJobsController],
  providers: [PaperImportDraftsService],
})
export class PaperImportDraftsModule {}
