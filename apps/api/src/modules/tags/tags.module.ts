import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TagGroupsController, TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

@Module({
  imports: [AuthModule],
  controllers: [TagsController, TagGroupsController],
  providers: [TagsService, TagsRepository],
  exports: [TagsService],
})
export class TagsModule {}
