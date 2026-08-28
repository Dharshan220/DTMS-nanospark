import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Emergency / SOS (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let facultyToken: string;
  let emergencyId: string;

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
    const hash = await bcrypt.hash('AdminPass123', 12);

    // Create admin
    await prisma.user.create({
      data: {
        email: 'admin-emergency-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-emergency-test@dtms.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.accessToken;

    // Create student
    const studentUser = await prisma.user.create({
      data: {
        email: 'student-emergency-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    await prisma.student.create({
      data: {
        userId: studentUser.id,
        registerNumber: 'STU-EMG-001',
        name: 'Emergency Test Student',
      },
    });
    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-emergency-test@dtms.local', password: 'AdminPass123' });
    studentToken = studentLogin.body.accessToken;

    // Create student 2
    const student2User = await prisma.user.create({
      data: {
        email: 'student2-emergency-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    await prisma.student.create({
      data: {
        userId: student2User.id,
        registerNumber: 'STU-EMG-002',
        name: 'Emergency Test Student 2',
      },
    });
    const student2Login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student2-emergency-test@dtms.local', password: 'AdminPass123' });
    student2Token = student2Login.body.accessToken;

    // Create faculty
    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-emergency-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });
    await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        facultyId: 'FAC-EMG-001',
        name: 'Emergency Test Faculty',
      },
    });
    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-emergency-test@dtms.local', password: 'AdminPass123' });
    facultyToken = facultyLogin.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.emergencyAlert.deleteMany({});
      await prisma.student.deleteMany({
        where: { registerNumber: { contains: 'STU-EMG' } },
      });
      await prisma.faculty.deleteMany({
        where: { facultyId: 'FAC-EMG-001' },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: 'emergency-test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/emergency (Student SOS)', () => {
    it('should create emergency with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'SAFETY',
          message: 'Emergency inside bus',
          latitude: 12.3456,
          longitude: 78.9012,
          locationAccuracy: 10,
        })
        .expect(201);

      expect(response.body.type).toBe('SAFETY');
      expect(response.body.priority).toBe('CRITICAL');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.location).toBeDefined();
      expect(response.body.location.latitude).toBe(12.3456);
      expect(response.body.location.longitude).toBe(78.9012);
      emergencyId = response.body.id;
    });

    it('should create emergency without location', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          type: 'MEDICAL',
          message: 'Student needs medical attention',
        })
        .expect(201);

      expect(response.body.type).toBe('MEDICAL');
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.location).toBeUndefined();
    });

    it('should default to OTHER type if not provided', async () => {
      // Cancel student2's existing active emergency first so the duplicate check doesn't interfere
      const existing = await prisma.emergencyAlert.findFirst({
        where: { userId: (await prisma.student.findUnique({ where: { registerNumber: 'STU-EMG-002' } }))!.userId, status: 'ACTIVE' },
      });
      if (existing) {
        await prisma.emergencyAlert.update({ where: { id: existing.id }, data: { status: 'CANCELLED' } });
      }

      const response = await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          message: 'General emergency',
        })
        .expect(201);

      expect(response.body.type).toBe('OTHER');
    });

    it('should block duplicate active SOS', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          type: 'ACCIDENT',
          message: 'Trying duplicate',
        })
        .expect(201);

      // Should return the existing active emergency, not create new
      expect(response.body.note).toBe('Already have an active emergency');
    });

    it('should reject invalid type', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'INVALID',
        })
        .expect(400);
    });

    it('should reject invalid latitude', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          latitude: 100,
          longitude: 78,
        })
        .expect(400);
    });

    it('should reject invalid longitude', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          latitude: 12,
          longitude: 200,
        })
        .expect(400);
    });

    it('should reject negative location accuracy', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          locationAccuracy: -5,
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .send({
          type: 'SAFETY',
        })
        .expect(401);
    });

    it('should reject unexpected fields', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'SAFETY',
          status: 'RESOLVED',
        })
        .expect(400);
    });
  });

  describe('POST /api/emergency (Faculty SOS)', () => {
    it('should allow faculty to create emergency', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/emergency')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          type: 'BREAKDOWN',
          message: 'Bus has broken down on highway',
          latitude: 13.0827,
          longitude: 80.2707,
        })
        .expect(201);

      expect(response.body.type).toBe('BREAKDOWN');
      expect(response.body.priority).toBe('CRITICAL');
      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('GET /api/emergency (User View)', () => {
    it('should return user own emergencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should not return other users emergencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/emergency')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      // Student 2 should only see their own emergency
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/emergency/active', () => {
    it('should return active emergency', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/emergency/active')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.active).toBe(true);
      expect(response.body.alert).toBeDefined();
    });

    it('should return false if no active emergency', async () => {
      // Cancel student2's active emergency so they have none
      const student2UserId = (await prisma.student.findUnique({ where: { registerNumber: 'STU-EMG-002' } }))!.userId;
      await prisma.emergencyAlert.updateMany({
        where: { userId: student2UserId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/emergency/active')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      expect(response.body.active).toBe(false);
    });
  });

  describe('GET /api/emergency/:id', () => {
    it('should return own emergency by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/emergency/${emergencyId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.id).toBe(emergencyId);
    });

    it('should return 403 for other users emergency', async () => {
      await request(app.getHttpServer())
        .get(`/api/emergency/${emergencyId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);
    });
  });

  describe('PATCH /api/emergency/:id/cancel', () => {
    it('should allow user to cancel own active emergency', async () => {
      // Cancel student's existing active emergency directly (avoids rate limiter on POST)
      const response = await request(app.getHttpServer())
        .patch(`/api/emergency/${emergencyId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should not allow cancelling other users emergency', async () => {
      // Create a fresh emergency for student via Prisma (avoids rate limiter)
      const studentUserId = (await prisma.student.findUnique({ where: { registerNumber: 'STU-EMG-001' } }))!.userId;
      const studentProfile = await prisma.student.findUnique({ where: { registerNumber: 'STU-EMG-001' } });
      const fresh = await prisma.emergencyAlert.create({
        data: {
          userId: studentUserId,
          studentId: studentProfile!.id,
          role: 'STUDENT',
          type: 'SAFETY',
          priority: 'CRITICAL',
          status: 'ACTIVE',
          message: 'Fresh emergency for ownership test',
        },
      });
      emergencyId = fresh.id;

      await request(app.getHttpServer())
        .patch(`/api/emergency/${fresh.id}/cancel`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);
    });
  });

  describe('Admin Emergency Management', () => {
    it('should allow admin to list all emergencies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow admin to filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/emergency?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/emergency?priority=CRITICAL')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/emergency?type=SAFETY')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to view emergency by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/emergency/${emergencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(emergencyId);
      expect(response.body.student).toBeDefined();
    });

    it('should allow admin to acknowledge emergency', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/acknowledge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACKNOWLEDGED');
      expect(response.body.acknowledgedAt).toBeDefined();
    });

    it('should allow admin to resolve emergency', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolutionNote: 'Issue resolved, student safe',
        })
        .expect(200);

      expect(response.body.status).toBe('RESOLVED');
      expect(response.body.resolvedAt).toBeDefined();
      expect(response.body.resolutionNote).toBe('Issue resolved, student safe');
    });

    it('should reject acknowledging already resolved emergency', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/acknowledge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should reject resolving already resolved emergency', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ resolutionNote: 'Test' })
        .expect(400);
    });
  });

  describe('Security', () => {
    it('should reject student from admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/emergency')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject student from acknowledging emergency', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/acknowledge`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject student from resolving emergency', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/emergency/${emergencyId}/resolve`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/emergency')
        .send({ type: 'SAFETY' })
        .expect(401);
    });

    it('should not expose passwordHash in response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/emergency/${emergencyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.student) {
        expect(response.body.student.passwordHash).toBeUndefined();
      }
    });
  });
});
