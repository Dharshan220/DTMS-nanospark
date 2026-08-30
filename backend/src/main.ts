import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import * as os from 'os';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const clusterMode = process.env.CLUSTER === 'true';
  const numCPUs = os.cpus().length;

  if (clusterMode && numCPUs > 1) {
    const cluster = await import('cluster');
    const primary = cluster.default;

    if (primary.isPrimary) {
      logger.log(`Primary ${process.pid} starting ${numCPUs} workers`);

      for (let i = 0; i < numCPUs; i++) {
        primary.fork();
      }

      primary.on('exit', (worker) => {
        logger.warn(`Worker ${worker.process.pid} died — restarting`);
        primary.fork();
      });
    } else {
      await startServer(logger);
    }
  } else {
    await startServer(logger);
  }
}

async function startServer(logger: Logger) {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  const configService = app.get(ConfigService);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  try {
    const helmet = (await import('helmet')).default;
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }));
  } catch {
    logger.warn('Helmet not available — skipping security headers');
  }

  app.use(require('express').json({ limit: '100kb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '100kb' }));

  const expressApp = app.getHttpServer();
  expressApp.timeout = 30000;
  expressApp.keepAliveTimeout = 65000;
  expressApp.headersTimeout = 35000;

  const port = configService.get<number>('PORT') || 5000;

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DTMS — Digital Transport Management System API')
      .setDescription(
        'Backend API for the College Digital Transport Management System.\n\n' +
        '---\n\n' +
        '## Getting Started — How to Authenticate\n\n' +
        'This API uses **JWT Bearer Token** authentication. Follow these steps to test protected endpoints:\n\n' +
        '### Step 1 — Login\n' +
        'Call the login endpoint to obtain an access token:\n\n' +
        '```http\n' +
        'POST /api/auth/login\n' +
        'Content-Type: application/json\n\n' +
        '{\n' +
        '  "email": "your-email@example.com",\n' +
        '  "password": "your-password"\n' +
        '}\n' +
        '```\n\n' +
        '**Valid credentials by role:**\n' +
        '- **Admin** — Use an admin account email and password\n' +
        '- **Student** — Use a student account email and password\n' +
        '- **Faculty** — Use a faculty account email and password\n\n' +
        '### Step 2 — Copy the Access Token\n' +
        'The login response includes an `accessToken` field:\n\n' +
        '```json\n' +
        '{\n' +
        '  "user": {\n' +
        '    "id": "clx1234567890abcdef",\n' +
        '    "email": "admin@example.com",\n' +
        '    "role": "ADMIN",\n' +
        '    "status": "ACTIVE"\n' +
        '  },\n' +
        '  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n' +
        '}\n' +
        '```\n\n' +
        '### Step 3 — Authorize in Swagger\n' +
        '1. Click the **Authorize** button at the top of this page\n' +
        '2. Paste the `accessToken` value (without the `Bearer ` prefix — it is added automatically)\n' +
        '3. Click **Authorize** and then **Close**\n\n' +
        '### Step 4 — Call Protected Endpoints\n' +
        'All endpoints marked with a 🔒 lock icon now include the `Authorization: Bearer <token>` header automatically.\n\n' +
        '---\n\n' +
        '## Roles & Access Control\n\n' +
        '| Role | Access |\n' +
        '|------|--------|\n' +
        '| **ADMIN** | Students, Faculty, Buses, Drivers, Routes, Stops, Schedules, Attendance, Complaints, Feedback, Emergency, Notifications, Analytics, Audit Logs |\n' +
        '| **FACULTY** | Profile, Transport Assignment, Attendance, Schedules, Emergency, Notifications |\n' +
        '| **STUDENT** | Profile, Transport Assignment, Complaints, Feedback, Schedules, Emergency, Notifications |\n\n' +
        'Endpoints are prefixed by role:\n' +
        '- `/api/admin/*` — Requires **ADMIN** role\n' +
        '- `/api/student/*` — Requires **STUDENT** role\n' +
        '- `/api/faculty/*` — Requires **FACULTY** role\n' +
        '- `/api/emergency/*` — Requires **STUDENT** or **FACULTY** role (admin endpoints under `/api/admin/emergency`)\n\n' +
        '### Public Endpoints (No Authentication Required)\n' +
        '- `POST /api/auth/login` — User login\n' +
        '- `POST /api/auth/refresh` — Refresh access token (uses httpOnly cookie)\n' +
        '- `GET /api/health` — Health check\n' +
        '- `GET /api/health/ready` — Readiness check\n' +
        '- `GET /api/webhooks/whatsapp` — WhatsApp webhook verification\n' +
        '- `POST /api/webhooks/whatsapp` — WhatsApp webhook receiver\n\n' +
        '---\n\n' +
        '## Token Refresh\n\n' +
        'The refresh endpoint (`POST /api/auth/refresh`) uses an **httpOnly cookie** (`refresh_token`).\n' +
        'The refresh token is never exposed in the response body or Swagger examples.\n' +
        'Access tokens expire after 15 minutes (configurable via `JWT_ACCESS_EXPIRY`).\n\n' +
        '---\n\n' +
        '## Pagination\n\n' +
        'List endpoints support `page` (default 1) and `limit` (default 20, max 100) query parameters.\n\n' +
        'Paginated response format:\n' +
        '```json\n' +
        '{\n' +
        '  "data": [],\n' +
        '  "pagination": {\n' +
        '    "page": 1,\n' +
        '    "limit": 20,\n' +
        '    "total": 100,\n' +
        '    "totalPages": 5\n' +
        '  }\n' +
        '}\n' +
        '```\n\n' +
        '---\n\n' +
        '## Common Error Responses\n\n' +
        '| Status | Meaning | Description |\n' +
        '|--------|---------|-------------|\n' +
        '| `400` | Bad Request | Invalid input data or validation error |\n' +
        '| `401` | Unauthorized | Missing or invalid JWT token, or invalid credentials |\n' +
        '| `403` | Forbidden | Authenticated but insufficient role permissions |\n' +
        '| `404` | Not Found | Resource does not exist |\n' +
        '| `409` | Conflict | Resource already exists (e.g., duplicate email) |\n' +
        '| `429` | Too Many Requests | Rate limit exceeded (login: 10/min) |',
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

  logger.log(`DTMS Backend running on http://localhost:${port} (PID: ${process.pid})`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
  logger.log(`Frontend URL: ${frontendUrl}`);
}

bootstrap();
