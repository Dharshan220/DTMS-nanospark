import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Faculty (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let createdFacultyId: string;

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

    await prisma.user.create({
      data: {
        email: 'admin-faculty-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-faculty-test@dtms.local', password: 'AdminPass123' });

    adminToken = loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.faculty.deleteMany({});
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

  describe('POST /api/admin/faculty', () => {
    it('should create faculty with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'faculty-crud-test@dtms.local',
          password: 'FacultyPass123',
          facultyId: 'FAC001',
          name: 'Test Faculty',
          phone: '9876543210',
          department: 'CSE',
          designation: 'Professor',
        })
        .expect(201);

      expect(response.body.email).toBe('faculty-crud-test@dtms.local');
      expect(response.body.facultyId).toBe('FAC001');
      expect(response.body.name).toBe('Test Faculty');
      createdFacultyId = response.body.id;
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'faculty-crud-test@dtms.local',
          password: 'FacultyPass123',
          facultyId: 'FAC002',
          name: 'Duplicate Email',
        })
        .expect(409);
    });

    it('should reject duplicate faculty ID', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'faculty-crud-test2@dtms.local',
          password: 'FacultyPass123',
          facultyId: 'FAC001',
          name: 'Duplicate Faculty ID',
        })
        .expect(409);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/faculty')
        .send({
          email: 'test@dtms.local',
          password: 'Pass123',
          facultyId: 'FAC999',
          name: 'Unauth Faculty',
        })
        .expect(401);
    });
  });

  describe('GET /api/admin/faculty', () => {
    it('should list faculty with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/faculty?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should search faculty by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/faculty?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/faculty/:id', () => {
    it('should get faculty by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdFacultyId);
      expect(response.body.facultyId).toBe('FAC001');
    });

    it('should return 404 for non-existent faculty', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/faculty/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/faculty/:id', () => {
    it('should update faculty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Faculty', phone: '1234567890' })
        .expect(200);

      expect(response.body.name).toBe('Updated Faculty');
      expect(response.body.phone).toBe('1234567890');
    });
  });

  describe('PATCH /api/admin/faculty/:id/status', () => {
    it('should deactivate faculty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/faculty/${createdFacultyId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');
    });

    it('should reactivate faculty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/faculty/${createdFacultyId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('Faculty Profile', () => {
    let facultyAuthToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'faculty-crud-test@dtms.local', password: 'FacultyPass123' });

      facultyAuthToken = loginResponse.body.accessToken;
    });

    it('should allow faculty to view own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/faculty/profile')
        .set('Authorization', `Bearer ${facultyAuthToken}`)
        .expect(200);

      expect(response.body.facultyId).toBe('FAC001');
      expect(response.body.name).toBe('Updated Faculty');
    });

    it('should reject faculty from admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${facultyAuthToken}`)
        .expect(403);
    });
  });

  describe('Security', () => {
    it('should never return passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.password).toBeUndefined();
    });
  });
});
