import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import {
  getRequestId,
  serializeRequest,
  serializeResponse,
} from './common/logger/pino-http';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
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
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              },
        autoLogging: {
          ignore: (request) =>
            request.url === '/api/health' || request.url === '/health',
        },
        genReqId: getRequestId,
        serializers: {
          req: serializeRequest,
          res: serializeResponse,
        },
        customLogLevel: (_request, response, error) => {
          if (error || response.statusCode >= 500) return 'error';
          if (response.statusCode >= 400) return 'warn';
          return 'info';
        },
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.accessToken',
          'req.body.refreshToken',
        ],
      },
    }),
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
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
