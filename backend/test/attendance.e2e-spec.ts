import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Attendance (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let facultyToken: string;
  let studentToken: string;
  let busId: string;
  let facultyId: string;
  let routeId: string;

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
        email: 'admin-attendance-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin-attendance-test@dtms.local', password: 'AdminPass123' });
    adminToken = adminLogin.body.accessToken;

    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-attendance-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });

    const facultyProfile = await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        facultyId: 'FAC-ATT-001',
        name: 'Attendance Test Faculty',
      },
    });
    facultyId = facultyProfile.id;

    const facultyLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'faculty-attendance-test@dtms.local', password: 'AdminPass123' });
    facultyToken = facultyLogin.body.accessToken;

    const studentUser = await prisma.user.create({
      data: {
        email: 'student-attendance-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    await prisma.student.create({
      data: {
        userId: studentUser.id,
        registerNumber: 'STU-ATT-001',
        name: 'Attendance Test Student',
      },
    });

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student-attendance-test@dtms.local', password: 'AdminPass123' });
    studentToken = studentLogin.body.accessToken;

    const route = await prisma.route.create({
      data: {
        routeCode: 'ATT-ROUTE-001',
        routeName: 'Attendance Test Route',
      },
    });
    routeId = route.id;

    const bus = await prisma.bus.create({
      data: {
        busNumber: 900,
        registrationNumber: 'TN-ATT-900',
        capacity: 60,
        routeId: route.id,
      },
    });
    busId = bus.id;

    await prisma.facultyBusAssignment.create({
      data: {
        facultyId: facultyProfile.id,
        busId: bus.id,
      },
    });
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.attendance.deleteMany({});
      await prisma.facultyBusAssignment.deleteMany({});
      await prisma.bus.deleteMany({ where: { busNumber: 900 } });
      await prisma.route.deleteMany({ where: { routeCode: 'ATT-ROUTE-001' } });
      await prisma.student.deleteMany({ where: { registerNumber: 'STU-ATT-001' } });
      await prisma.faculty.deleteMany({ where: { facultyId: 'FAC-ATT-001' } });
      await prisma.user.deleteMany({
        where: { email: { contains: 'attendance-test@dtms.local' } },
      });
    }
    await app.close();
  });

  describe('POST /api/faculty/attendance', () => {
    it('should create attendance with valid counts', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: 25,
          girlsCount: 20,
          totalCount: 45,
          tripType: 'MORNING',
        })
        .expect(201);

      expect(response.body.boysCount).toBe(25);
      expect(response.body.girlsCount).toBe(20);
      expect(response.body.totalCount).toBe(45);
      expect(response.body.tripType).toBe('MORNING');
    });

    it('should reject invalid total count', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: 25,
          girlsCount: 20,
          totalCount: 50,
          tripType: 'EVENING',
        })
        .expect(400);
    });

    it('should reject total exceeding bus capacity', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: 35,
          girlsCount: 30,
          totalCount: 65,
          tripType: 'MORNING',
        })
        .expect(400);
    });

    it('should reject negative counts', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: -5,
          girlsCount: 20,
          totalCount: 15,
          tripType: 'MORNING',
        })
        .expect(400);
    });

    it('should reject decimal counts', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: 25.5,
          girlsCount: 20,
          totalCount: 45.5,
          tripType: 'MORNING',
        })
        .expect(400);
    });

    it('should reject invalid trip type', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          boysCount: 25,
          girlsCount: 20,
          totalCount: 45,
          tripType: 'AFTERNOON',
        })
        .expect(400);
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .send({
          boysCount: 25,
          girlsCount: 20,
          totalCount: 45,
          tripType: 'MORNING',
        })
        .expect(401);
    });
  });

  describe('GET /api/faculty/attendance', () => {
    it('should return faculty attendance history', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('Admin Attendance', () => {
    it('should allow admin to view all attendance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should allow admin to filter by trip type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/attendance?tripType=MORNING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('Student Restrictions', () => {
    it('should reject student from creating attendance', async () => {
      await request(app.getHttpServer())
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          boysCount: 25,
          girlsCount: 20,
          totalCount: 45,
          tripType: 'MORNING',
        })
        .expect(403);
    });

    it('should reject student from viewing admin attendance', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Security', () => {
    it('should never return passwordHash in attendance response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/faculty/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0].passwordHash).toBeUndefined();
      }
    });
  });
});
