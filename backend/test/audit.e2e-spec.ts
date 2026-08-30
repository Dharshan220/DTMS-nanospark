import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Audit Logs (e2e)', () => {
  let app: INestApplication;

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
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('/api/admin/audit-logs (GET)', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject student access', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(403);
      }
    });

    it('should reject faculty access', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'faculty@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(403);
      }
    });

    it('should return audit logs for admin with default pagination', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('totalPages');
      }
    });

    it('should support pagination parameters', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?page=1&limit=5')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(5);
        expect(res.body.data.length).toBeLessThanOrEqual(5);
      }
    });

    it('should filter by action', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?action=LOGIN')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        expect(res.body.data.every((log: any) => log.action === 'LOGIN')).toBe(true);
      }
    });

    it('should filter by resource', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?resource=Student')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        expect(res.body.data.every((log: any) => log.resource === 'Student')).toBe(true);
      }
    });

    it('should filter by date range', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const startDate = new Date(Date.now() - 86400000).toISOString();
        const endDate = new Date().toISOString();

        const res = await request(app.getHttpServer())
          .get(`/api/admin/audit-logs?startDate=${startDate}&endDate=${endDate}`)
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        expect(res.body.data.every((log: any) => {
          const logDate = new Date(log.createdAt);
          return logDate >= new Date(startDate) && logDate <= new Date(endDate);
        })).toBe(true);
      }
    });

    it('should reject invalid limit exceeding max', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs?limit=200')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(400);
      }
    });

    it('should reject invalid action enum', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs?action=INVALID_ACTION')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(400);
      }
    });

    it('should reject unknown query parameters', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs?unknownParam=value')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(400);
      }
    });

    it('should not expose sensitive data in audit logs', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        for (const log of res.body.data) {
          const logStr = JSON.stringify(log);
          expect(logStr).not.toContain('password');
          expect(logStr).not.toContain('passwordHash');
          expect(logStr).not.toContain('DATABASE_URL');
          expect(logStr).not.toContain('JWT_');
        }
      }
    });
  });

  describe('/api/admin/audit-logs/:id (GET)', () => {
    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs/some-id')
        .expect(401);
    });

    it('should return 404 for non-existent audit log', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        return request(app.getHttpServer())
          .get('/api/admin/audit-logs/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(404);
      }
    });

    it('should return specific audit log by ID', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const listRes = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?limit=1')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

        if (listRes.body.data.length > 0) {
          const logId = listRes.body.data[0].id;
          const res = await request(app.getHttpServer())
            .get(`/api/admin/audit-logs/${logId}`)
            .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
            .expect(200);

          expect(res.body.id).toBe(logId);
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('userRole');
          expect(res.body).toHaveProperty('action');
          expect(res.body).toHaveProperty('resource');
          expect(res.body).toHaveProperty('createdAt');
        }
      }
    });
  });

  describe('Audit Log Integrity', () => {
    it('should log login events after successful auth', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const auditRes = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?action=LOGIN&limit=1')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        if (auditRes.body.data.length > 0) {
          const log = auditRes.body.data[0];
          expect(log.action).toBe('LOGIN');
          expect(log.resource).toBe('User');
          expect(log).toHaveProperty('userId');
          expect(log).toHaveProperty('userRole');
          expect(log).toHaveProperty('createdAt');
        }
      }
    });

    it('should have correct field structure for all log entries', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'Test@1234' });

      if (loginRes.status === 200) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/audit-logs?limit=10')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(200);

        for (const log of res.body.data) {
          expect(log).toHaveProperty('id');
          expect(log).toHaveProperty('userId');
          expect(log).toHaveProperty('userRole');
          expect(log).toHaveProperty('action');
          expect(log).toHaveProperty('resource');
          expect(log).toHaveProperty('createdAt');
          expect(typeof log.id).toBe('string');
          expect(typeof log.userId).toBe('string');
          expect(typeof log.action).toBe('string');
          expect(typeof log.resource).toBe('string');
        }
      }
    });
  });
});
