import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { loggerConfig } from './config/logger.config';
import { HealthController } from './health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ExamsModule } from './modules/exams/exams.module';
import { LibraryModule } from './modules/library/library.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MockExamsModule } from './modules/mock-exams/mock-exams.module';
import { PaperImportDraftsModule } from './modules/paper-import-drafts/paper-import-drafts.module';
import { PapersModule } from './modules/papers/papers.module';
import { QuestionAttemptsModule } from './modules/question-attempts/question-attempts.module';
import { QuestionNotesModule } from './modules/question-notes/question-notes.module';
import { QuestionReportsModule } from './modules/question-reports/question-reports.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { ReviewModule } from './modules/review/review.module';
import { SolveSessionsModule } from './modules/solve-sessions/solve-sessions.module';
import { StudyActivityModule } from './modules/study-activity/study-activity.module';
import { StudyWeeklyGoalsModule } from './modules/study-weekly-goals/study-weekly-goals.module';
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
    LoggerModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    MetricsModule,
    AuthModule,
    SolveSessionsModule,
    BookmarksModule,
    CategoriesModule,
    ExamsModule,
    TagsModule,
    MockExamsModule,
    PaperImportDraftsModule,
    PapersModule,
    QuestionAttemptsModule,
    QuestionNotesModule,
    QuestionReportsModule,
    QuestionsModule,
    ReviewModule,
    LibraryModule,
    StudyActivityModule,
    StudyWeeklyGoalsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
