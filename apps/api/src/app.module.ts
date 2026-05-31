import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { HealthController } from './health.controller';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnswerSessionsModule } from './modules/answer-sessions/answer-sessions.module';
import { ExamsModule } from './modules/exams/exams.module';
import { PapersModule } from './modules/papers/papers.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { LibraryModule } from './modules/library/library.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
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
    AnswerSessionsModule,
    ExamsModule,
    SubjectsModule,
    TagsModule,
    PapersModule,
    QuestionsModule,
    LibraryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
