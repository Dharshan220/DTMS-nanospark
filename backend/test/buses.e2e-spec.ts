import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Buses (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let createdBusId: string;
  let driverId: string;

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
        email: 'admin-bus-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-bus-test@dtms.local', password: 'AdminPass123' });

    adminToken = loginResponse.body.accessToken;

    const driver = await prisma.driver.create({
      data: {
        driverCode: 'BUS-TEST-DRV',
        name: 'Bus Test Driver',
        licenseNumber: 'TN-BUS-TEST-001',
      },
    });
    driverId = driver.id;
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

  describe('POST /api/admin/buses', () => {
    it('should create a bus with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busNumber: 100,
          registrationNumber: 'TN 22 BS 1000',
          capacity: 60,
          boysCapacity: 30,
          girlsCapacity: 30,
        })
        .expect(201);

      expect(response.body.busNumber).toBe(100);
      expect(response.body.capacity).toBe(60);
      createdBusId = response.body.id;
    });

    it('should create bus with driver assignment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busNumber: 101,
          registrationNumber: 'TN 22 BS 1001',
          capacity: 50,
          driverId: driverId,
        })
        .expect(201);

      expect(response.body.driverId).toBe(driverId);
      expect(response.body.driver).toBeDefined();
    });

    it('should reject duplicate bus number', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busNumber: 100,
          registrationNumber: 'TN 22 BS 9999',
        })
        .expect(409);
    });

    it('should reject duplicate registration number', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busNumber: 999,
          registrationNumber: 'TN 22 BS 1000',
        })
        .expect(409);
    });

    it('should reject invalid capacity', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busNumber: 102,
          registrationNumber: 'TN 22 BS 1002',
          capacity: 60,
          boysCapacity: 40,
          girlsCapacity: 30,
        })
        .expect(400);
    });
  });

  describe('GET /api/admin/buses', () => {
    it('should list buses with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/buses?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should search buses by registration number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/buses?search=TN 22 BS 1000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/buses/:id', () => {
    it('should get bus by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/buses/${createdBusId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdBusId);
      expect(response.body.busNumber).toBe(100);
    });

    it('should return 404 for non-existent bus', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/buses/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/buses/:id', () => {
    it('should update bus', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: 70 })
        .expect(200);

      expect(response.body.capacity).toBe(70);
    });
  });

  describe('PATCH /api/admin/buses/:id/status', () => {
    it('should set bus under maintenance', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'MAINTENANCE' })
        .expect(200);

      expect(response.body.status).toBe('MAINTENANCE');
    });

    it('should reactivate bus', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('PATCH /api/admin/buses/:id/driver', () => {
    it('should assign driver to bus', async () => {
      const newDriver = await prisma.driver.create({
        data: {
          driverCode: 'BUS-ASSIGN-DRV',
          name: 'Assign Test Driver',
          licenseNumber: 'TN-BUS-ASSIGN-001',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}/driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: newDriver.id })
        .expect(200);

      expect(response.body.driverId).toBe(newDriver.id);
    });

    it('should unassign driver from bus', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}/driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: null })
        .expect(200);

      expect(response.body.driverId).toBeNull();
    });

    it('should reject inactive driver assignment', async () => {
      const inactiveDriver = await prisma.driver.create({
        data: {
          driverCode: 'BUS-INACTIVE-DRV',
          name: 'Inactive Driver',
          licenseNumber: 'TN-BUS-INACTIVE-001',
          status: 'INACTIVE',
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/admin/buses/${createdBusId}/driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: inactiveDriver.id })
        .expect(400);
    });
  });

  describe('Security', () => {
    it('should never return passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/buses/${createdBusId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.passwordHash).toBeUndefined();
    });
  });
});
