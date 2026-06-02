import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { HealthController } from './health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ExamsModule } from './modules/exams/exams.module';
import { LibraryModule } from './modules/library/library.module';
import { PaperImportDraftsModule } from './modules/paper-import-drafts/paper-import-drafts.module';
import { PapersModule } from './modules/papers/papers.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { ReviewModule } from './modules/review/review.module';
import { SolveSessionsModule } from './modules/solve-sessions/solve-sessions.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: [
        'apps/api/.env.local',
        'apps/api/.env',
        '.env.local',
        '.env',
      ],
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    SolveSessionsModule,
    BookmarksModule,
    CategoriesModule,
    ExamsModule,
    TagsModule,
    PaperImportDraftsModule,
    PapersModule,
    QuestionsModule,
    ReviewModule,
    LibraryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
