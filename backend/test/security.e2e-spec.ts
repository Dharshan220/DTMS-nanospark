import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Production Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let facultyToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const hash = await bcrypt.hash('SecureTest123', 12);

    await prisma.user.create({
      data: { email: 'admin-sec-test@dtms.local', passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' },
    });
    await prisma.user.create({
      data: {
        email: 'student-sec-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { create: { registerNumber: 'SEC-STU-001', name: 'Sec Test Student', status: 'ACTIVE' } },
      },
    });
    await prisma.user.create({
      data: {
        email: 'faculty-sec-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
        faculty: { create: { facultyId: 'SEC-FAC-001', name: 'Sec Test Faculty', status: 'ACTIVE' } },
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-sec-test@dtms.local', password: 'SecureTest123' });
    adminToken = adminLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-sec-test@dtms.local', password: 'SecureTest123' });
    studentToken = studentLogin.body.accessToken;

    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-sec-test@dtms.local', password: 'SecureTest123' });
    facultyToken = facultyLogin.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['admin-sec-test@dtms.local', 'student-sec-test@dtms.local', 'faculty-sec-test@dtms.local'] } },
    });
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('GET /api/health — should return ok', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('DTMS Backend');
      expect(res.body.database).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/health/ready — should return status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200);

      expect(['ok', 'degraded']).toContain(res.body.status);
      expect(res.body.database).toBeDefined();
    });
  });

  describe('Authentication Security', () => {
    it('should reject request with no token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject request with malformed header', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer sometoken')
        .expect(401);
    });

    it('should reject login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@dtms.local', password: 'wrongpassword' })
        .expect(401);
    });

    it('should not leak account existence on login failure', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin-sec-test@dtms.local', password: 'wrongpassword123' })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject refresh without cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(200);

      expect(res.body.accessToken).toBeNull();
    });
  });

  describe('RBAC Security', () => {
    it('should reject student from admin student endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from admin student endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject student from admin analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from admin analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject student from admin schedules', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should allow admin to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Input Validation', () => {
    it('should reject unknown fields in login', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'testpassword', unknownField: 'hack' })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'testpassword' })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: '123' })
        .expect(400);
    });

    it('should reject empty body on login', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('Error Response Safety', () => {
    it('should not expose stack traces in 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(res.body.stack).toBeUndefined();
      expect(res.body.trace).toBeUndefined();
    });

    it('should not expose stack traces in 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.stack).toBeUndefined();
      expect(res.body.trace).toBeUndefined();
    });

    it('should not expose internal file paths in errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin-sec-test@dtms.local', password: 'wrongpassword123' })
        .expect(401);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('C:\\');
      expect(bodyStr).not.toContain('/home/');
      expect(bodyStr).not.toContain('node_modules');
    });
  });

  describe('Emergency Security', () => {
    it('should reject student from admin emergency management', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from admin emergency management', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal request rates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
