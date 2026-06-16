import { Module } from '@nestjs/common';

import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { ExamsModule } from '../exams/exams.module';
import { QuestionsModule } from '../questions/questions.module';
import { PapersController, PublicPapersController } from './papers.controller';
import { PapersRepository } from './papers.repository';
import { PapersService } from './papers.service';

@Module({
  imports: [AuthModule, ExamsModule, QuestionsModule, StorageModule],
  controllers: [PapersController, PublicPapersController],
  providers: [PapersService, PapersRepository],
  exports: [PapersService],
})
export class PapersModule {}
