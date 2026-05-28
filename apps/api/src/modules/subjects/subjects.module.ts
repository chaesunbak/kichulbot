import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubjectsController } from './subjects.controller';
import { SubjectsRepository } from './subjects.repository';
import { SubjectsService } from './subjects.service';

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, SubjectsRepository],
  exports: [SubjectsService],
})
export class SubjectsModule {}
