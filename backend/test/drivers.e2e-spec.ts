import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Drivers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let createdDriverId: string;

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
        email: 'admin-driver-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-driver-test@dtms.local', password: 'AdminPass123' });

    adminToken = loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.bus.deleteMany({});
      await prisma.driver.deleteMany({});
      await prisma.user.deleteMany({
        where: { email: { contains: 'test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/admin/drivers', () => {
    it('should create a driver with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverCode: 'DRV001',
          name: 'Test Driver',
          phone: '9876543210',
          licenseNumber: 'TN-25-2021-00001',
          licenseExpiry: '2027-03-31',
          experienceYears: 5,
        })
        .expect(201);

      expect(response.body.driverCode).toBe('DRV001');
      expect(response.body.name).toBe('Test Driver');
      expect(response.body.status).toBe('ACTIVE');
      createdDriverId = response.body.id;
    });

    it('should reject duplicate driver code', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverCode: 'DRV001',
          name: 'Duplicate Code',
          licenseNumber: 'TN-25-2021-00002',
        })
        .expect(409);
    });

    it('should reject duplicate license number', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverCode: 'DRV002',
          name: 'Duplicate License',
          licenseNumber: 'TN-25-2021-00001',
        })
        .expect(409);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/drivers')
        .send({
          driverCode: 'DRV999',
          name: 'Unauth',
          licenseNumber: 'TN-25-2021-99999',
        })
        .expect(401);
    });
  });

  describe('GET /api/admin/drivers', () => {
    it('should list drivers with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/drivers?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should search drivers by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/drivers?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/drivers/:id', () => {
    it('should get driver by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/drivers/${createdDriverId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdDriverId);
      expect(response.body.driverCode).toBe('DRV001');
    });

    it('should return 404 for non-existent driver', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/drivers/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/drivers/:id', () => {
    it('should update driver', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/drivers/${createdDriverId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Driver', phone: '1234567890' })
        .expect(200);

      expect(response.body.name).toBe('Updated Driver');
      expect(response.body.phone).toBe('1234567890');
    });
  });

  describe('PATCH /api/admin/drivers/:id/status', () => {
    it('should mark driver on leave', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/drivers/${createdDriverId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ON_LEAVE' })
        .expect(200);

      expect(response.body.status).toBe('ON_LEAVE');
    });

    it('should reactivate driver', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/drivers/${createdDriverId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('Authorization', () => {
    it('should reject faculty from driver endpoints', async () => {
      const hash = await bcrypt.hash('FacPass123', 12);
      await prisma.user.create({
        data: {
          email: 'faculty-driver-test@dtms.local',
          passwordHash: hash,
          role: 'FACULTY',
          status: 'ACTIVE',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'faculty-driver-test@dtms.local', password: 'FacPass123' });

      await request(app.getHttpServer())
        .get('/api/admin/drivers')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(403);
    });

    it('should reject student from driver endpoints', async () => {
      const hash = await bcrypt.hash('StuPass123', 12);
      await prisma.user.create({
        data: {
          email: 'student-driver-test@dtms.local',
          passwordHash: hash,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-driver-test@dtms.local', password: 'StuPass123' });

      await request(app.getHttpServer())
        .get('/api/admin/drivers')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(403);
    });
  });
});
