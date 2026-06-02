import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PaperImportDraftsController } from './paper-import-drafts.controller';
import { PaperImportDraftsService } from './paper-import-drafts.service';

@Module({
  imports: [AuthModule],
  controllers: [PaperImportDraftsController],
  providers: [PaperImportDraftsService],
})
export class PaperImportDraftsModule {}
