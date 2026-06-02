import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SolveSessionsModule } from '../solve-sessions/solve-sessions.module';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksRepository } from './bookmarks.repository';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [AuthModule, SolveSessionsModule],
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarksRepository],
})
export class BookmarksModule {}
