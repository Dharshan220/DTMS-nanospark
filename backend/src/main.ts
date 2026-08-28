import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS — production-safe
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation pipe — reject unknown fields in production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // Security headers via Helmet
  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet({
      contentSecurityPolicy: false, // API-only, no inline scripts
      crossOriginEmbedderPolicy: false,
    }));
  } catch {
    logger.warn('Helmet not available — skipping security headers');
  }

  // Request body size limit (100kb — sufficient for all DTMS payloads)
  app.use(require('express').json({ limit: '100kb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '100kb' }));

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);

  logger.log(`DTMS Backend running on http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
  logger.log(`Frontend URL: ${frontendUrl}`);
}

bootstrap();
