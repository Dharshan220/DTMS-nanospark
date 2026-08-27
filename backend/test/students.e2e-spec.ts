import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Students (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let createdStudentId: string;
  let adminUserId: string;

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

    const admin = await prisma.user.create({
      data: {
        email: 'admin-student-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = admin.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-student-test@dtms.local', password: 'AdminPass123' });

    adminToken = loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.student.deleteMany({});
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'test@dtms.local',
          },
        },
      });
    }
    await app.close();
  });

  describe('POST /api/admin/students', () => {
    it('should create a student with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'student-crud-test@dtms.local',
          password: 'StudentPass123',
          registerNumber: '24CS101',
          name: 'Test Student',
          phone: '9876543210',
          department: 'CSE',
          year: 'III',
          section: 'A',
          gender: 'male',
        })
        .expect(201);

      expect(response.body.email).toBe('student-crud-test@dtms.local');
      expect(response.body.registerNumber).toBe('24CS101');
      expect(response.body.name).toBe('Test Student');
      expect(response.body.status).toBe('ACTIVE');
      createdStudentId = response.body.id;
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'student-crud-test@dtms.local',
          password: 'StudentPass123',
          registerNumber: '24CS102',
          name: 'Duplicate Email',
        })
        .expect(409);
    });

    it('should reject duplicate register number', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'student-crud-test2@dtms.local',
          password: 'StudentPass123',
          registerNumber: '24CS101',
          name: 'Duplicate Register',
        })
        .expect(409);
    });

    it('should reject invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid',
          password: '123',
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/students')
        .send({
          email: 'test@dtms.local',
          password: 'Pass123',
          registerNumber: '24CS999',
          name: 'Unauth Student',
        })
        .expect(401);
    });
  });

  describe('GET /api/admin/students', () => {
    it('should list students with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/students?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should search students by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/students?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .expect(401);
    });
  });

  describe('GET /api/admin/students/:id', () => {
    it('should get a student by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdStudentId);
      expect(response.body.registerNumber).toBe('24CS101');
    });

    it('should return 404 for non-existent student', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/students/:id', () => {
    it('should update a student', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Student', phone: '1234567890' })
        .expect(200);

      expect(response.body.name).toBe('Updated Student');
      expect(response.body.phone).toBe('1234567890');
    });
  });

  describe('PATCH /api/admin/students/:id/status', () => {
    it('should deactivate a student', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/students/${createdStudentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');
    });

    it('should reactivate a student', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/students/${createdStudentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('Student Profile', () => {
    let studentAuthToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-crud-test@dtms.local', password: 'StudentPass123' });

      studentAuthToken = loginResponse.body.accessToken;
    });

    it('should allow student to view own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/profile')
        .set('Authorization', `Bearer ${studentAuthToken}`)
        .expect(200);

      expect(response.body.registerNumber).toBe('24CS101');
      expect(response.body.name).toBe('Updated Student');
    });

    it('should reject student from admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${studentAuthToken}`)
        .expect(403);
    });
  });

  describe('Security', () => {
    it('should never return passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.password).toBeUndefined();
    });

    it('should reject request with wrong role', async () => {
      const studentLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-crud-test@dtms.local', password: 'StudentPass123' });

      await request(app.getHttpServer())
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${studentLogin.body.accessToken}`)
        .send({
          email: 'test@dtms.local',
          password: 'Pass123',
          registerNumber: '24CS999',
          name: 'Unauthorized',
        })
        .expect(403);
    });
  });
});
