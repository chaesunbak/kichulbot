import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

@Module({
  imports: [AuthModule],
  controllers: [TagsController],
  providers: [TagsService, TagsRepository],
})
export class TagsModule {}
