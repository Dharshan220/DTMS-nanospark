import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Schedules (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let studentToken: string;
  let facultyToken: string;
  let busId: string;
  let routeId: string;
  let scheduleId: string;
  let overrideId: string;

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
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-schedule-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-schedule-test@dtms.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.accessToken;

    // Create route
    const route = await prisma.route.create({
      data: {
        routeCode: 'SCH-R01',
        routeName: 'Schedule Test Route',
        status: 'ACTIVE',
      },
    });
    routeId = route.id;

    // Create buses
    const bus1 = await prisma.bus.create({
      data: {
        busNumber: 9001,
        registrationNumber: 'TN-24-SCH-001',
        routeId: routeId,
        status: 'ACTIVE',
      },
    });
    busId = bus1.id;

    const bus2 = await prisma.bus.create({
      data: {
        busNumber: 9002,
        registrationNumber: 'TN-24-SCH-002',
        routeId: routeId,
        status: 'ACTIVE',
      },
    });

    // Create student with transport assignment
    const studentUser = await prisma.user.create({
      data: {
        email: 'student-schedule-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    const studentProfile = await prisma.student.create({
      data: {
        userId: studentUser.id,
        registerNumber: 'STU-SCH-001',
        name: 'Schedule Test Student',
      },
    });
    const busStop = await prisma.busStop.create({
      data: {
        stopCode: 'SCH-STOP-01',
        name: 'Schedule Test Stop',
        status: 'ACTIVE',
      },
    });
    await prisma.studentBusAssignment.create({
      data: {
        studentId: studentProfile.id,
        busId: busId,
        busStopId: busStop.id,
        status: 'ACTIVE',
      },
    });

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-schedule-test@dtms.local', password: 'AdminPass123' });
    studentToken = studentLogin.body.accessToken;

    // Create faculty with transport assignment
    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-schedule-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });
    const facultyProfile = await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        facultyId: 'FAC-SCH-001',
        name: 'Schedule Test Faculty',
      },
    });
    await prisma.facultyBusAssignment.create({
      data: {
        facultyId: facultyProfile.id,
        busId: busId,
        status: 'ACTIVE',
      },
    });

    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-schedule-test@dtms.local', password: 'AdminPass123' });
    facultyToken = facultyLogin.body.accessToken;
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.scheduleOverride.deleteMany({});
      await prisma.transportSchedule.deleteMany({});
      await prisma.studentBusAssignment.deleteMany({});
      await prisma.facultyBusAssignment.deleteMany({});
      await prisma.student.deleteMany({
        where: { registerNumber: { contains: 'STU-SCH' } },
      });
      await prisma.faculty.deleteMany({
        where: { facultyId: 'FAC-SCH-001' },
      });
      await prisma.busStop.deleteMany({
        where: { stopCode: { contains: 'SCH-STOP' } },
      });
      await prisma.bus.deleteMany({
        where: { registrationNumber: { contains: 'TN-24-SCH' } },
      });
      await prisma.route.deleteMany({
        where: { routeCode: { contains: 'SCH-R' } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: 'schedule-test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/admin/schedules', () => {
    it('should create schedule with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
          effectiveUntil: '2026-12-31',
        })
        .expect(201);

      expect(response.body.bus.id).toBe(busId);
      expect(response.body.route.id).toBe(routeId);
      expect(response.body.tripType).toBe('MORNING');
      expect(response.body.departureTime).toBe('08:00');
      expect(response.body.expectedArrivalTime).toBe('08:45');
      expect(response.body.status).toBe('ACTIVE');
      scheduleId = response.body.id;
    });

    it('should reject duplicate active schedule', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
          effectiveUntil: '2026-12-31',
        })
        .expect(409);
    });

    it('should reject invalid bus', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId: 'nonexistent-bus',
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(404);
    });

    it('should reject invalid route', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId: 'nonexistent-route',
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(404);
    });

    it('should reject invalid trip type', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'AFTERNOON',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(400);
    });

    it('should reject invalid time format', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '25:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(401);
    });

    it('should reject student from creating schedule', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(403);
    });

    it('should reject faculty from creating schedule', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '08:00',
          expectedArrivalTime: '08:45',
          effectiveFrom: '2026-09-01',
        })
        .expect(403);
    });

    it('should allow different trip type for same bus/route', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'EVENING',
          departureTime: '16:00',
          expectedArrivalTime: '16:45',
          effectiveFrom: '2026-09-01',
          effectiveUntil: '2026-12-31',
        })
        .expect(201);

      expect(response.body.tripType).toBe('EVENING');
    });
  });

  describe('GET /api/admin/schedules', () => {
    it('should list all schedules', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter by tripType', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/schedules?tripType=MORNING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((s: any) => s.tripType === 'MORNING')).toBe(true);
    });

    it('should filter by busId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/schedules?busId=${busId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((s: any) => s.bus.id === busId)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/schedules?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.every((s: any) => s.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('GET /api/admin/schedules/:id', () => {
    it('should return schedule by id with details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(scheduleId);
      expect(response.body.bus).toBeDefined();
      expect(response.body.route).toBeDefined();
      expect(response.body.overrides).toBeDefined();
    });

    it('should return 404 for nonexistent schedule', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/schedules/:id', () => {
    it('should update departure time', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departureTime: '08:15', expectedArrivalTime: '09:00' })
        .expect(200);

      expect(response.body.departureTime).toBe('08:15');
      expect(response.body.expectedArrivalTime).toBe('09:00');
    });

    it('should update status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');

      // Re-activate
      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);
    });
  });

  describe('PATCH /api/admin/schedules/:id/activate', () => {
    it('should activate schedule', async () => {
      // First deactivate
      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' });

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('PATCH /api/admin/schedules/:id/deactivate', () => {
    it('should deactivate schedule', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('INACTIVE');

      // Re-activate for further tests
      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('PATCH /api/admin/schedules/:id/cancel', () => {
    it('should cancel schedule', async () => {
      // Create a separate schedule to cancel
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '07:00',
          expectedArrivalTime: '07:45',
          effectiveFrom: '2026-09-01',
        });
      const cancelId = createRes.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${cancelId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should not allow cancelling already cancelled schedule', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${scheduleId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      // Create and cancel
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '06:00',
          expectedArrivalTime: '06:45',
          effectiveFrom: '2026-09-01',
        });
      const doubleCancelId = createRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${doubleCancelId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${doubleCancelId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/admin/schedules/:id/overrides', () => {
    it('should create bus replacement override', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/admin/schedules/${scheduleId}/overrides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2026-09-05',
          replacementBusId: busId,
          reason: 'Bus maintenance',
        })
        .expect(201);

      expect(response.body.status).toBe('REPLACED');
      expect(response.body.replacementBus).toBeDefined();
      overrideId = response.body.id;
    });

    it('should create daily cancellation override', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/admin/schedules/${scheduleId}/overrides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2026-09-06',
          reason: 'Holiday',
        })
        .expect(201);

      expect(response.body.status).toBe('CANCELLED');
    });

    it('should reject duplicate override for same date', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin/schedules/${scheduleId}/overrides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2026-09-05',
          replacementBusId: busId,
        })
        .expect(409);
    });

    it('should reject override on cancelled schedule', async () => {
      const cancelledSchedule = await request(app.getHttpServer())
        .post('/api/admin/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          busId,
          routeId,
          tripType: 'MORNING',
          departureTime: '05:00',
          expectedArrivalTime: '05:45',
          effectiveFrom: '2026-09-01',
        });

      await request(app.getHttpServer())
        .patch(`/api/admin/schedules/${cancelledSchedule.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/admin/schedules/${cancelledSchedule.body.id}/overrides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2026-09-10',
          replacementBusId: busId,
        })
        .expect(400);
    });

    it('should reject nonexistent replacement bus', async () => {
      await request(app.getHttpServer())
        .post(`/api/admin/schedules/${scheduleId}/overrides`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2026-09-07',
          replacementBusId: 'nonexistent-bus',
        })
        .expect(404);
    });
  });

  describe('GET /api/student/schedules/my', () => {
    it('should return student schedules', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/schedules/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.assignment).toBeDefined();
      expect(response.body.schedules).toBeDefined();
      expect(Array.isArray(response.body.schedules)).toBe(true);
    });

    it('should include trip status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/student/schedules/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      for (const schedule of response.body.schedules) {
        expect(['SCHEDULED', 'CANCELLED', 'REPLACED']).toContain(schedule.tripStatus);
      }
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/student/schedules/my')
        .expect(401);
    });
  });

  describe('GET /api/faculty/schedules/my', () => {
    it('should return faculty schedules', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/faculty/schedules/my')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.assignment).toBeDefined();
      expect(response.body.schedules).toBeDefined();
    });

    it('should reject student from accessing faculty endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/faculty/schedules/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Security', () => {
    it('should reject student from admin schedule endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject faculty from admin schedule endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should reject unauthenticated admin requests', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/schedules')
        .expect(401);
    });
  });
});
