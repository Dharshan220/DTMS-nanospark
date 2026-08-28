import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Complaints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let facultyToken: string;
  let studentId: string;
  let student2Id: string;
  let complaintId: string;

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
        email: 'admin-complaints-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-complaints-test@dtms.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.accessToken;

    // Create student 1
    const studentUser = await prisma.user.create({
      data: {
        email: 'student-complaints-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const studentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        registerNumber: 'STU-COMP-001',
        name: 'Complaints Test Student',
      },
    });
    studentId = studentProfile.id;
    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-complaints-test@dtms.local', password: 'AdminPass123' });
    studentToken = studentLogin.body.accessToken;

    // Create student 2 (for cross-access tests)
    const student2User = await prisma.user.create({
      data: {
        email: 'student2-complaints-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const student2Profile = await prisma.student.create({
      data: {
        userId: student2User.id,
        registerNumber: 'STU-COMP-002',
        name: 'Complaints Test Student 2',
      },
    });
    student2Id = student2Profile.id;
    const student2Login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student2-complaints-test@dtms.local', password: 'AdminPass123' });
    student2Token = student2Login.body.accessToken;

    // Create faculty
    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-complaints-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });
    await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        facultyId: 'FAC-COMP-001',
        name: 'Complaints Test Faculty',
      },
    });
    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-complaints-test@dtms.local', password: 'AdminPass123' });
    facultyToken = facultyLogin.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.complaint.deleteMany({});
      await prisma.feedback.deleteMany({});
      await prisma.student.deleteMany({
        where: { registerNumber: { contains: 'STU-COMP' } },
      });
      await prisma.faculty.deleteMany({
        where: { facultyId: 'FAC-COMP-001' },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: 'complaints-test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/student/complaints', () => {
    it('should create complaint with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Bus arrives late every morning',
          description: 'The bus consistently arrives 15 minutes late to the main gate stop',
          category: 'BUS',
          priority: 'HIGH',
        })
        .expect(201);

      expect(response.body.subject).toBe('Bus arrives late every morning');
      expect(response.body.category).toBe('BUS');
      expect(response.body.priority).toBe('HIGH');
      expect(response.body.status).toBe('OPEN');
      complaintId = response.body.id;
    });

    it('should create complaint with default MEDIUM priority', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Driver behavior issue',
          description: 'The driver was speaking on phone while driving',
          category: 'DRIVER',
        })
        .expect(201);

      expect(response.body.priority).toBe('MEDIUM');
    });

    it('should reject empty subject', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '',
          description: 'Some description here',
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject short description', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test complaint',
          description: 'Short',
          category: 'BUS',
        })
        .expect(400);
    });

    it('should reject invalid category', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test complaint',
          description: 'This is a valid description for testing purposes',
          category: 'INVALID',
        })
        .expect(400);
    });

    it('should reject invalid priority', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test complaint',
          description: 'This is a valid description for testing purposes',
          category: 'BUS',
          priority: 'INVALID',
        })
        .expect(400);
    });

    it('should reject unexpected fields', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test complaint',
          description: 'This is a valid description for testing purposes',
          category: 'BUS',
          status: 'RESOLVED',
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/student/complaints')
        .send({
          subject: 'Test complaint',
          description: 'This is a valid description for testing purposes',
          category: 'BUS',
        })
        .expect(401);
    });
  });

  describe('GET /api/student/complaints', () => {
    it('should return student own complaints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should not return other students complaints', async () => {
      // Student 2 should see empty list since they haven't created any
      const response = await request(app.getHttpServer())
        .get('/api/student/complaints')
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/student/complaints/:id', () => {
    it('should return own complaint by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/student/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.id).toBe(complaintId);
    });

    it('should return 403 for other students complaint', async () => {
      await request(app.getHttpServer())
        .get(`/api/student/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(403);
    });
  });

  describe('Student cannot delete or change status', () => {
    it('should not have DELETE endpoint', async () => {
      // DELETE endpoint should not exist
      await request(app.getHttpServer())
        .delete(`/api/student/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('Admin Complaint Management', () => {
    it('should allow admin to list all complaints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/complaints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should allow admin to filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/complaints?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/complaints?category=BUS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to view complaint by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(complaintId);
      expect(response.body.student).toBeDefined();
    });

    it('should allow admin to update status to IN_REVIEW', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_REVIEW' })
        .expect(200);

      expect(response.body.status).toBe('IN_REVIEW');
    });

    it('should allow admin to resolve complaint', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          resolutionNote: 'Bus schedule has been updated',
        })
        .expect(200);

      expect(response.body.status).toBe('RESOLVED');
      expect(response.body.resolutionNote).toBe('Bus schedule has been updated');
      expect(response.body.resolvedAt).toBeDefined();
    });

    it('should reject invalid status transition', async () => {
      // Create a new complaint for testing
      const createResponse = await request(app.getHttpServer())
        .post('/api/student/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Status transition test',
          description: 'This complaint is for testing status transitions',
          category: 'ROUTE',
        });
      const newId = createResponse.body.id;

      // Try to go directly to RESOLVED (should be IN_REVIEW first)
      await request(app.getHttpServer())
        .patch(`/api/admin/complaints/${newId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'RESOLVED' })
        .expect(400);
    });
  });

  describe('Security', () => {
    it('should reject student from accessing admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from accessing admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/complaints')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject unauthenticated admin request', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/complaints')
        .expect(401);
    });
  });
});
