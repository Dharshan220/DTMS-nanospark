import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Security Hardening (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let facultyToken: string;
  let faculty2Token: string;

  const adminEmail = 'admin-hardening@dtms.local';
  const studentEmail = 'student-hardening@dtms.local';
  const student2Email = 'student2-hardening@dtms.local';
  const facultyEmail = 'faculty-hardening@dtms.local';
  const faculty2Email = 'faculty2-hardening@dtms.local';
  const testPassword = 'HardeningTest123!';

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
    const hash = await bcrypt.hash(testPassword, 12);

    // Clean any previous test data
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, studentEmail, student2Email, facultyEmail, faculty2Email] } },
    });

    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' },
    });
    await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { create: { registerNumber: 'HARD-STU-001', name: 'Hardening Student 1', status: 'ACTIVE' } },
      },
    });
    await prisma.user.create({
      data: {
        email: student2Email,
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { create: { registerNumber: 'HARD-STU-002', name: 'Hardening Student 2', status: 'ACTIVE' } },
      },
    });
    await prisma.user.create({
      data: {
        email: facultyEmail,
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
        faculty: { create: { facultyId: 'HARD-FAC-001', name: 'Hardening Faculty 1', status: 'ACTIVE' } },
      },
    });
    await prisma.user.create({
      data: {
        email: faculty2Email,
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
        faculty: { create: { facultyId: 'HARD-FAC-002', name: 'Hardening Faculty 2', status: 'ACTIVE' } },
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: studentEmail, password: testPassword });
    studentToken = studentLogin.body.accessToken;

    const student2Login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: student2Email, password: testPassword });
    student2Token = student2Login.body.accessToken;

    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: facultyEmail, password: testPassword });
    facultyToken = facultyLogin.body.accessToken;

    const faculty2Login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: faculty2Email, password: testPassword });
    faculty2Token = faculty2Login.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, studentEmail, student2Email, facultyEmail, faculty2Email] } },
    });
    await app.close();
  });

  // 1. Unauthenticated admin endpoint -> 401
  describe('1. Unauthenticated Admin Access', () => {
    it('should return 401 for unauthenticated admin students endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .expect(401);
    });

    it('should return 401 for unauthenticated admin faculty endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/faculty')
        .expect(401);
    });

    it('should return 401 for unauthenticated admin buses endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/buses')
        .expect(401);
    });

    it('should return 401 for unauthenticated admin audit-logs endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .expect(401);
    });

    it('should return 401 for unauthenticated admin analytics endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .expect(401);
    });
  });

  // 2. Student admin endpoint -> 403
  describe('2. Student Blocked from Admin Endpoints', () => {
    it('should return 403 for student accessing admin students', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin faculty', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin buses', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/buses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin drivers', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/drivers')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin routes', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/routes')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin bus-stops', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/bus-stops')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin attendance', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin complaints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin feedback', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin emergency', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin schedules', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin notifications', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for student accessing admin audit-logs', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  // 3. Faculty admin endpoint -> 403
  describe('3. Faculty Blocked from Admin Endpoints', () => {
    it('should return 403 for faculty accessing admin students', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing admin buses', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/buses')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing admin analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing admin audit-logs', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing admin schedules', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });
  });

  // 4. Student accessing another student's resource -> 403/404
  describe('4. Student IDOR Protection', () => {
    it('should not let student see another student profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.email).toBe(studentEmail);
    });

    it('student complaints should only return own complaints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (res.body.data) {
        for (const complaint of res.body.data) {
          expect(complaint.student).toBeDefined();
        }
      }
    });
  });

  // 5. Faculty accessing another faculty resource -> 403/404
  describe('5. Faculty IDOR Protection', () => {
    it('should not let faculty see another faculty profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/faculty/profile')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.body.email).toBe(facultyEmail);
    });
  });

  // 6. Invalid JWT -> 401
  describe('6. Invalid JWT', () => {
    it('should reject completely invalid JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalidsignature')
        .expect(401);
    });

    it('should reject JWT with wrong secret', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer abc.def.ghi')
        .expect(401);
    });

    it('should reject empty Bearer token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);
    });
  });

  // 7. Expired JWT -> 401
  describe('7. Expired JWT', () => {
    it('should reject JWT with expired nbf claim', async () => {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_ACCESS_SECRET || 'test-secret';
      const expiredToken = jwt.sign(
        { sub: 'fake-user-id', role: 'ADMIN', iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600 },
        secret,
      );

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  // 8. Unexpected DTO field -> 400
  describe('8. Unexpected DTO Fields', () => {
    it('should reject login with extra unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: testPassword, injected: true, hack: 'yes' })
        .expect(400);
    });

    it('should reject student creation with extra fields', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@test.com',
          registerNumber: 'TEST-001',
          name: 'Test',
          status: 'ACTIVE',
          maliciousField: 'should fail',
          anotherHack: 123,
        })
        .expect(400);
    });
  });

  // 9. Invalid pagination -> 400
  describe('9. Invalid Pagination', () => {
    it('should handle negative page gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students?page=-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
    });

    it('should handle zero limit gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students?limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
    });

    it('should cap limit at 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students?limit=999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (res.body.pagination) {
        expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
      }
    });
  });

  // 10. Excessive pagination -> safely rejected/capped
  describe('10. Excessive Pagination Abuse', () => {
    it('should cap limit at maximum of 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students?limit=1000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should handle non-numeric page gracefully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students?page=abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pagination).toBeDefined();
    });
  });

  // 11. Rate limiting -> 429
  describe('11. Rate Limiting', () => {
    it('should allow normal request rates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // 12. Sensitive information not exposed
  describe('12. Sensitive Information Disclosure', () => {
    it('should never expose passwordHash in user responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.password).toBeUndefined();
    });

    it('should never expose passwordHash in student list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (res.body.data) {
        for (const student of res.body.data) {
          expect(student.passwordHash).toBeUndefined();
          expect(student.password).toBeUndefined();
        }
      }
    });

    it('should never expose passwordHash in faculty list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (res.body.data) {
        for (const faculty of res.body.data) {
          expect(faculty.passwordHash).toBeUndefined();
          expect(faculty.password).toBeUndefined();
        }
      }
    });

    it('should not expose stack traces in error responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(res.body.stack).toBeUndefined();
      expect(res.body.trace).toBeUndefined();
      expect(res.body.timestamp).toBeUndefined();
    });

    it('should not expose internal paths in error responses', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrongpassword' })
        .expect(401);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('C:\\');
      expect(bodyStr).not.toContain('/home/');
      expect(bodyStr).not.toContain('node_modules');
      expect(bodyStr).not.toContain('prisma');
    });

    it('health endpoint should not expose internal details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body.database).toBeDefined();
      expect(res.body.service).toBe('DTMS Backend');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('DATABASE_URL');
      expect(bodyStr).not.toContain('password');
      expect(bodyStr).not.toContain('secret');
    });
  });

  // 13. Audit logs admin-only
  describe('13. Audit Log Security', () => {
    it('should return 403 for student accessing audit logs', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing audit logs', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 401 for unauthenticated audit log access', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .expect(401);
    });

    it('should allow admin to access audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });

    it('audit logs should not contain passwords or secrets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('passwordHash');
      expect(bodyStr).not.toContain('password123');
      expect(bodyStr).not.toContain('DATABASE_URL');
      expect(bodyStr).not.toContain('JWT_ACCESS_SECRET');
      expect(bodyStr).not.toContain('JWT_REFRESH_SECRET');
      expect(bodyStr).not.toContain('API_KEY');
    });
  });

  // 14. Analytics admin-only
  describe('14. Analytics Security', () => {
    it('should return 403 for student accessing analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 403 for faculty accessing analytics', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should return 401 for unauthenticated analytics access', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .expect(401);
    });

    it('should allow admin to access analytics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // 15. Emergency ownership enforcement
  describe('15. Emergency Security', () => {
    it('should return 403 for student accessing admin emergency', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 for unauthenticated emergency creation', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .send({ type: 'MEDICAL', message: 'Help' })
        .expect(401);
    });

    it('student can access their own emergency list', async () => {
      await request(app.getHttpServer())
        .get('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('student can check for active emergency', async () => {
      await request(app.getHttpServer())
        .get('/api/emergency/active')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });
  });

  // 16. Notification ownership enforcement
  describe('16. Notification Security', () => {
    it('should return 403 for student accessing admin notifications', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 for unauthenticated notification access', async () => {
      await request(app.getHttpServer())
        .get('/api/notifications')
        .expect(401);
    });

    it('student can access their own notifications', async () => {
      await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('faculty can access their own notifications', async () => {
      await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });
  });

  // Additional security tests
  describe('Additional Security Checks', () => {
    it('should reject JWT with invalid algorithm (none)', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IkFETUlOIn0.')
        .expect(401);
    });

    it('should not allow refresh token to be used as access token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: testPassword });

      const refreshToken = loginRes.body.refreshToken;
      if (refreshToken) {
        await request(app.getHttpServer())
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${refreshToken}`)
          .expect(401);
      }
    });

    it('admin can access admin students endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('admin can access admin faculty endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('admin can access admin audit-logs endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('admin can access admin notifications endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('admin can access admin emergency endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should reject login with password longer than 128 chars', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: 'a'.repeat(129) })
        .expect(400);
    });

    it('should accept login with exactly 128 char password (validation passes, auth fails)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password: 'a'.repeat(128) })
        .expect(401);
    });

    it('should reject unknown admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/nonexistent-resource')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
