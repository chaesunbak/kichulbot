import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';
import { ExceptionFilter } from './common/filters/exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const origins = configService.getOrThrow<string[]>('app.webOrigins');
  const isProduction = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 로컬 스토리지 드라이버에서는 업로드된 문제 이미지를 /uploads 로 정적 제공한다.
  if (configService.get<string>('storage.driver') === 'local') {
    const localDir = configService.getOrThrow<string>('storage.local.dir');
    app.useStaticAssets(localDir, {
      prefix: '/uploads/',
      setHeaders: (response: Response) => {
        response.setHeader('Access-Control-Allow-Origin', '*');
      },
    });
  }

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ExceptionFilter());

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Kichulbot API')
      .setDescription('Kichulbot backend API documentation')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = cleanupOpenApiDoc(
      SwaggerModule.createDocument(app, swaggerConfig),
    );
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
}

void bootstrap();
