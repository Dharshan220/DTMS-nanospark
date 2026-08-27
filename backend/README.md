# DTMS Backend

NestJS backend for the DACE Transport Management System.

## Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Access + Refresh tokens)
- **Password Hashing:** bcryptjs

## Authentication Architecture

### Roles

| Role | Description | Has Login |
|------|-------------|-----------|
| `ADMIN` | System administrator | Yes |
| `FACULTY` | Faculty/teacher | Yes |
| `STUDENT` | Student | Yes |
| `DRIVER` | Transport entity only | **No login** |

> **DRIVER** is a transport-management record only. It does NOT exist as an authentication role.
> **STUDENT_ADMIN** does NOT exist in this system.

### Token Strategy

- **Access Token:** Short-lived (15 minutes), JWT, sent as Bearer header
- **Refresh Token:** Long-lived (7 days), JWT, stored as HttpOnly cookie

### Password Security

- Passwords are hashed with bcryptjs (12 salt rounds)
- Plain-text passwords are never stored, logged, or returned via API

## API Endpoints

### POST /api/auth/login

Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "STUDENT",
    "status": "ACTIVE"
  },
  "accessToken": "eyJ..."
}
```

**Errors:**
- `400` - Invalid input (missing email/password, invalid format)
- `401` - Invalid credentials or inactive account
- `429` - Too many requests (rate limited: 10 per minute)

### GET /api/auth/me

Get current authenticated user. Requires Bearer token.

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "...",
  "email": "user@example.com",
  "role": "STUDENT",
  "status": "ACTIVE"
}
```

### POST /api/auth/logout

Logout and clear refresh token cookie. Requires Bearer token.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### POST /api/auth/refresh

Refresh access token using refresh token cookie.

**Response (200):**
```json
{
  "accessToken": "eyJ..."
}
```

## Role-Based Authorization

Use the `@Roles()` decorator to protect endpoints:

```typescript
import { Roles } from './auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin/users')
getUsers() { ... }
```

Available guards:
- `JwtAuthGuard` - Requires valid JWT token
- `RolesGuard` - Requires specific role(s)

Available decorators:
- `@Roles(Role.ADMIN, Role.FACULTY)` - Restrict to specified roles
- `@CurrentUser()` - Inject authenticated user into handler

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | CORS origin | `http://localhost:8080` |
| `JWT_ACCESS_SECRET` | Access token signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | Required |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `ADMIN_EMAIL` | Seed admin email | `admin@dtms.local` |
| `ADMIN_PASSWORD` | Seed admin password | Required for seed |

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

### 3. Run database migration

```bash
npx prisma migrate dev
```

### 4. Seed admin account

```bash
npx prisma db seed
```

This creates an admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

> The seed refuses to run with unsafe/default passwords in production.

### 5. Start development server

```bash
npm run start:dev
```

Server runs at `http://localhost:5000/api`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm run start:dev` | Development with watch |
| `npm run start:prod` | Run production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed admin account |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Admin seed script
│   └── migrations/            # Database migrations
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts # Login, logout, me, refresh
│   │   ├── auth.service.ts    # Auth business logic
│   │   ├── auth.module.ts     # Auth module
│   │   ├── auth.service.spec.ts
│   │   ├── dto/
│   │   │   └── login.dto.ts   # Login validation
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│   ├── common/                # Shared utilities
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── auth.e2e-spec.ts
│   └── auth.integration-spec.ts
├── .env.example
└── package.json
```

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npx jest auth.service.spec
```

## Security Notes

- Passwords are never returned in API responses
- Login is rate-limited (10 requests per minute)
- CORS is configured for frontend origin only
- Helmet security headers enabled
- Input validation with class-validator
- HttpOnly cookies for refresh tokens
- Secure cookies in production mode
