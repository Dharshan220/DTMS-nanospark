import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security headers
  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet());
  } catch {
    logger.warn('Helmet not available — skipping security headers');
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`DTMS Backend running on http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
  logger.log(`Frontend URL: ${frontendUrl}`);
}

bootstrap();
