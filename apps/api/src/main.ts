import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  if (config.get<string>('TRUST_PROXY') === 'true') {
    app.set('trust proxy', 1);
  }
  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, !origin || origins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-cart-session',
      'Accept',
    ],
    optionsSuccessStatus: 204,
  });
  app.enableShutdownHooks();
  await app.listen(config.get<number>('PORT') ?? 3000);
}

void bootstrap().catch((error: unknown) => {
  console.error('API failed to start', error);
  process.exitCode = 1;
});
