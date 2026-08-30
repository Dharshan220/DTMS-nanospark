import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  const configService = app.get(ConfigService);

  // Global exception filter — sanitizes errors in production
  app.useGlobalFilters(new AllExceptionsFilter());

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

  // Swagger / OpenAPI documentation (skip in production)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DTMS — Digital Transport Management System API')
      .setDescription(
        'Backend API for the College Digital Transport Management System.\n\n' +
        '## Authentication\n' +
        'Most endpoints require a JWT Bearer token. Login via `POST /api/auth/login` to obtain an access token.\n\n' +
        '## Roles\n' +
        '- **ADMIN** — Full system access (students, faculty, buses, drivers, routes, schedules, analytics, audit logs)\n' +
        '- **FACULTY** — Profile, transport assignment, attendance management, emergency alerts\n' +
        '- **STUDENT** — Profile, transport assignment, complaints, feedback, emergency alerts\n\n' +
        '## Pagination\n' +
        'List endpoints support `page` (default 1) and `limit` (default 20, max 100) query parameters.\n\n' +
        '## Common Response Format\n' +
        'Paginated endpoints return:\n' +
        '```json\n' +
        '{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }\n' +
        '```',
      )
      .setVersion('1.0.0')
      .setContact('DTMS Team', '', '')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token',
        },
        'access-token',
      )
      .addTag('Auth', 'Authentication — login, logout, refresh, current user')
      .addTag('Students', 'Student management (Admin) and student profile')
      .addTag('Faculty', 'Faculty management (Admin) and faculty profile')
      .addTag('Buses', 'Bus fleet management')
      .addTag('Drivers', 'Driver management')
      .addTag('Routes', 'Route management')
      .addTag('Bus Stops', 'Bus stop management')
      .addTag('Route Stops', 'Route-stop association management')
      .addTag('Transport Assignments', 'Student/faculty bus and route assignments')
      .addTag('Attendance', 'Bus attendance tracking (Faculty & Admin)')
      .addTag('Complaints', 'Student complaint submission and admin management')
      .addTag('Feedback', 'Student feedback submission and admin management')
      .addTag('Emergency', 'Emergency/SOS alerts (Student/Faculty & Admin)')
      .addTag('Notifications', 'Notification management and delivery')
      .addTag('Schedules', 'Transport schedule management and overrides')
      .addTag('Analytics', 'System analytics and reporting dashboards')
      .addTag('Audit Logs', 'Admin activity audit trail')
      .addTag('Health', 'Health check and readiness probes')
      .addTag('Webhooks', 'External webhook receivers')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(`API docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.log(`DTMS Backend running on http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
  logger.log(`Frontend URL: ${frontendUrl}`);
}

bootstrap();
