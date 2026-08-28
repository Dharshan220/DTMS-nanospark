import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Feedback (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let facultyToken: string;
  let feedbackId: string;

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
        email: 'admin-feedback-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-feedback-test@dtms.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.accessToken;

    // Create student 1
    const studentUser = await prisma.user.create({
      data: {
        email: 'student-feedback-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    await prisma.student.create({
      data: {
        userId: studentUser.id,
        registerNumber: 'STU-FB-001',
        name: 'Feedback Test Student',
      },
    });
    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-feedback-test@dtms.local', password: 'AdminPass123' });
    studentToken = studentLogin.body.accessToken;

    // Create student 2
    const student2User = await prisma.user.create({
      data: {
        email: 'student2-feedback-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    await prisma.student.create({
      data: {
        userId: student2User.id,
        registerNumber: 'STU-FB-002',
        name: 'Feedback Test Student 2',
      },
    });
    const student2Login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student2-feedback-test@dtms.local', password: 'AdminPass123' });
    student2Token = student2Login.body.accessToken;

    // Create faculty
    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-feedback-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });
    await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        facultyId: 'FAC-FB-001',
        name: 'Feedback Test Faculty',
      },
    });
    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-feedback-test@dtms.local', password: 'AdminPass123' });
    facultyToken = facultyLogin.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.feedback.deleteMany({});
      await prisma.complaint.deleteMany({});
      await prisma.student.deleteMany({
        where: { registerNumber: { contains: 'STU-FB' } },
      });
      await prisma.faculty.deleteMany({
        where: { facultyId: 'FAC-FB-001' },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: 'feedback-test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/student/feedback', () => {
    it('should create feedback with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Great bus service',
          message: 'The bus service has been excellent this semester, very punctual and clean',
          rating: 5,
          category: 'BUS',
        })
        .expect(201);

      expect(response.body.subject).toBe('Great bus service');
      expect(response.body.rating).toBe(5);
      expect(response.body.status).toBe('SUBMITTED');
      feedbackId = response.body.id;
    });

    it('should reject rating below 1', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Low rating test',
          message: 'Testing low rating rejection',
          rating: 0,
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject rating above 5', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'High rating test',
          message: 'Testing high rating rejection',
          rating: 6,
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject decimal rating', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Decimal rating test',
          message: 'Testing decimal rating rejection',
          rating: 4.5,
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject invalid category', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Invalid category test',
          message: 'Testing invalid category rejection',
          rating: 4,
          category: 'INVALID',
        })
        .expect(400);
    });

    it('should reject empty subject', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '',
          message: 'Testing empty subject rejection',
          rating: 4,
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject short message', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          message: 'Short',
          rating: 4,
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject unexpected fields', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test feedback',
          message: 'This is a valid feedback message for testing',
          rating: 4,
          category: 'BUS',
          status: 'REVIEWED',
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/student/feedback')
        .send({
          subject: 'Test feedback',
          message: 'This is a valid feedback message for testing',
          rating: 4,
          category: 'BUS',
        })
        .expect(401);
    });
  });

  describe('GET /api/student/feedback', () => {
    it('should return student own feedback', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should not return other students feedback', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/feedback')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/student/feedback/:id', () => {
    it('should return own feedback by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/student/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.id).toBe(feedbackId);
    });

    it('should return 403 for other students feedback', async () => {
      await request(app.getHttpServer())
        .get(`/api/student/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);
    });
  });

  describe('Student cannot delete feedback', () => {
    it('should not have DELETE endpoint', async () => {
      await request(app.getHttpServer())
        .delete(`/api/student/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('Admin Feedback Management', () => {
    it('should allow admin to list all feedback', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should allow admin to filter by rating', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/feedback?rating=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/feedback?category=BUS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to view feedback by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(feedbackId);
      expect(response.body.student).toBeDefined();
    });

    it('should allow admin to mark feedback as reviewed', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'REVIEWED' })
        .expect(200);

      expect(response.body.status).toBe('REVIEWED');
      expect(response.body.reviewedAt).toBeDefined();
    });

    it('should allow admin to resolve feedback', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' })
        .expect(200);

      expect(response.body.status).toBe('RESOLVED');
    });
  });

  describe('Security', () => {
    it('should reject student from accessing admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from accessing admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/feedback')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject unauthenticated admin request', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/feedback')
        .expect(401);
    });
  });
});
