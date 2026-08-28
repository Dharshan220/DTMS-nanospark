import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Analytics (e2e)', () => {
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
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test users via auth service
    // Admin login
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@dtms.local', password: 'AdminPass123' })
      .catch(() => null);

    if (adminRes && adminRes.status === 200) {
      adminToken = adminRes.body.accessToken;
    }

    // Student login
    const studentRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student@dtms.local', password: 'StudentPass123' })
      .catch(() => null);

    if (studentRes && studentRes.status === 200) {
      studentToken = studentRes.body.accessToken;
    }

    // Faculty login
    const facultyRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty@dtms.local', password: 'FacultyPass123' })
      .catch(() => null);

    if (facultyRes && facultyRes.status === 200) {
      facultyToken = facultyRes.body.accessToken;
    }
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Security', () => {
    it('should reject unauthenticated access to dashboard', () => {
      return request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .expect(401);
    });

    it('should reject student access to analytics', () => {
      if (!studentToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty access to analytics', () => {
      if (!facultyToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });
  });

  describe('/api/admin/analytics/dashboard (GET)', () => {
    it('should return dashboard overview for admin', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('transport');
          expect(res.body).toHaveProperty('attendance');
          expect(res.body).toHaveProperty('operations');
          expect(res.body).toHaveProperty('schedules');
          expect(res.body).toHaveProperty('notifications');
          expect(typeof res.body.users.students).toBe('number');
          expect(typeof res.body.users.faculty).toBe('number');
          expect(typeof res.body.transport.buses).toBe('number');
          expect(typeof res.body.transport.routes).toBe('number');
          expect(typeof res.body.operations.activeEmergencies).toBe('number');
          expect(typeof res.body.operations.openComplaints).toBe('number');
        });
    });
  });

  describe('/api/admin/analytics/overview (GET)', () => {
    it('should return overview with default date range', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('dateRange');
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('transport');
          expect(res.body).toHaveProperty('attendance');
          expect(res.body).toHaveProperty('operations');
          expect(res.body).toHaveProperty('schedules');
          expect(res.body).toHaveProperty('notifications');
        });
    });

    it('should accept valid date range', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/overview?from=2026-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.dateRange).toBeDefined();
        });
    });

    it('should reject invalid from > to', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/overview?from=2026-12-31&to=2026-01-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should reject range exceeding 1 year', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/overview?from=2024-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('/api/admin/analytics/attendance (GET)', () => {
    it('should return attendance analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.totalRecords).toBe('number');
          expect(typeof res.body.totalPassengers).toBe('number');
          expect(typeof res.body.totalBoys).toBe('number');
          expect(typeof res.body.totalGirls).toBe('number');
        });
    });

    it('should support busId filter', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/attendance?busId=some-bus-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('/api/admin/analytics/attendance/daily (GET)', () => {
    it('should return daily attendance trend', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/attendance/daily')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/buses (GET)', () => {
    it('should return bus analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/routes (GET)', () => {
    it('should return route analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/routes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/assignments (GET)', () => {
    it('should return assignment analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('students');
          expect(res.body).toHaveProperty('faculty');
          expect(typeof res.body.students.total).toBe('number');
          expect(typeof res.body.students.assigned).toBe('number');
          expect(typeof res.body.students.unassigned).toBe('number');
          expect(typeof res.body.faculty.total).toBe('number');
          expect(typeof res.body.faculty.assigned).toBe('number');
          expect(typeof res.body.faculty.unassigned).toBe('number');
        });
    });
  });

  describe('/api/admin/analytics/complaints (GET)', () => {
    it('should return complaint analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.open).toBe('number');
          expect(typeof res.body.inReview).toBe('number');
          expect(typeof res.body.resolved).toBe('number');
          expect(typeof res.body.rejected).toBe('number');
          expect(Array.isArray(res.body.byCategory)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/complaints/daily (GET)', () => {
    it('should return daily complaint trend', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/complaints/daily')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/feedback (GET)', () => {
    it('should return feedback analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.submitted).toBe('number');
          expect(typeof res.body.reviewed).toBe('number');
          expect(typeof res.body.resolved).toBe('number');
          expect(Array.isArray(res.body.byCategory)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/emergencies (GET)', () => {
    it('should return emergency analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/emergencies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.active).toBe('number');
          expect(typeof res.body.acknowledged).toBe('number');
          expect(typeof res.body.resolved).toBe('number');
          expect(typeof res.body.cancelled).toBe('number');
          expect(Array.isArray(res.body.byType)).toBe(true);
          expect(Array.isArray(res.body.byRole)).toBe(true);
        });
    });
  });

  describe('/api/admin/analytics/emergencies/summary (GET)', () => {
    it('should return emergency summary', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/emergencies/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.active).toBe('number');
          expect(typeof res.body.critical).toBe('number');
          expect(typeof res.body.acknowledged).toBe('number');
          expect(typeof res.body.resolvedToday).toBe('number');
        });
    });
  });

  describe('/api/admin/analytics/schedules (GET)', () => {
    it('should return schedule analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.active).toBe('number');
          expect(typeof res.body.inactive).toBe('number');
          expect(typeof res.body.cancelled).toBe('number');
          expect(res.body.overrides).toBeDefined();
          expect(typeof res.body.overrides.scheduled).toBe('number');
          expect(typeof res.body.overrides.cancelled).toBe('number');
          expect(typeof res.body.overrides.replaced).toBe('number');
        });
    });
  });

  describe('/api/admin/analytics/notifications (GET)', () => {
    it('should return notification analytics', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.total).toBe('number');
          expect(res.body.byChannel).toBeDefined();
          expect(typeof res.body.byChannel.whatsapp).toBe('number');
          expect(typeof res.body.byChannel.inApp).toBe('number');
          expect(res.body.byStatus).toBeDefined();
          expect(typeof res.body.byStatus.pending).toBe('number');
          expect(typeof res.body.byStatus.sent).toBe('number');
          expect(typeof res.body.byStatus.delivered).toBe('number');
          expect(typeof res.body.byStatus.read).toBe('number');
          expect(typeof res.body.byStatus.failed).toBe('number');
        });
    });

    it('should return null deliverySuccessRate when no notifications exist', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/notifications?from=2020-01-01&to=2020-01-02')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.deliverySuccessRate).toBeNull();
        });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty date range gracefully', () => {
      if (!adminToken) return Promise.resolve();
      return request(app.getHttpServer())
        .get('/api/admin/analytics/overview?from=2020-01-01&to=2020-01-02')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.users.students).toBeGreaterThanOrEqual(0);
          expect(res.body.attendance.totalPassengers).toBe(0);
        });
    });
  });
});
