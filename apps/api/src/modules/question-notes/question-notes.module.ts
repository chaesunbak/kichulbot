import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QuestionNotesController } from './question-notes.controller';
import { QuestionNotesRepository } from './question-notes.repository';
import { QuestionNotesService } from './question-notes.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionNotesController],
  providers: [QuestionNotesService, QuestionNotesRepository],
})
export class QuestionNotesModule {}
