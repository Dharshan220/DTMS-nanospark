import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUser: any;
  let testFaculty: any;
  let testAdmin: any;

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

    const hash = await bcrypt.hash('TestPass123', 12);

    testUser = await prisma.user.create({
      data: {
        email: 'student-test@dtms.local',
        passwordHash: hash,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    testFaculty = await prisma.user.create({
      data: {
        email: 'faculty-test@dtms.local',
        passwordHash: hash,
        role: 'FACULTY',
        status: 'ACTIVE',
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'admin-test@dtms.local',
        passwordHash: hash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }, 30000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              'student-test@dtms.local',
              'faculty-test@dtms.local',
              'admin-test@dtms.local',
            ],
          },
        },
      });
    }
    await app.close();
  });

  describe('Login', () => {
    it('should login with valid student credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'TestPass123' })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('student-test@dtms.local');
      expect(response.body.user.role).toBe('STUDENT');
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should login with valid faculty credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'faculty-test@dtms.local', password: 'TestPass123' })
        .expect(200);

      expect(response.body.user.role).toBe('FACULTY');
    });

    it('should login with valid admin credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin-test@dtms.local', password: 'TestPass123' })
        .expect(200);

      expect(response.body.user.role).toBe('ADMIN');
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@dtms.local', password: 'TestPass123' })
        .expect(401);
    });

    it('should reject missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: 'TestPass123' })
        .expect(400);
    });

    it('should reject missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@dtms.local' })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@dtms.local', password: '12345' })
        .expect(400);
    });
  });

  describe('Inactive Account', () => {
    let inactiveUser: any;

    beforeAll(async () => {
      const hash = await bcrypt.hash('TestPass123', 12);
      inactiveUser = await prisma.user.create({
        data: {
          email: 'inactive-test@dtms.local',
          passwordHash: hash,
          role: 'STUDENT',
          status: 'INACTIVE',
        },
      });
    });

    afterAll(async () => {
      if (inactiveUser) {
        await prisma.user.delete({ where: { id: inactiveUser.id } });
      }
    });

    it('should reject login for inactive account', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'inactive-test@dtms.local', password: 'TestPass123' })
        .expect(401);
    });
  });

  describe('Current User (/api/auth/me)', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'TestPass123' });

      authToken = response.body.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('student-test@dtms.local');
      expect(response.body.role).toBe('STUDENT');
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);
    });
  });

  describe('Logout', () => {
    let authToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'TestPass123' });

      authToken = response.body.accessToken;
    });

    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject unauthenticated logout', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401);
    });
  });

  describe('Security', () => {
    it('should never return password hash in login response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'TestPass123' })
        .expect(200);

      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should never return password hash in me response', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student-test@dtms.local', password: 'TestPass123' });

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.password).toBeUndefined();
    });
  });
});
