import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

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
import { QuestionAttemptsModule } from './modules/question-attempts/question-attempts.module';
import { QuestionNotesModule } from './modules/question-notes/question-notes.module';
import { QuestionReportsModule } from './modules/question-reports/question-reports.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { ReviewModule } from './modules/review/review.module';
import { SolveSessionsModule } from './modules/solve-sessions/solve-sessions.module';
import { TagsModule } from './modules/tags/tags.module';

function getRequestId(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) {
  const header = request.headers['x-request-id'];
  const requestId = Array.isArray(header) ? header[0] : header;
  const id = requestId?.trim() || randomUUID();

  response.setHeader('X-Request-Id', id);

  return id;
}

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
    AuthModule,
    SolveSessionsModule,
    BookmarksModule,
    CategoriesModule,
    ExamsModule,
    TagsModule,
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
