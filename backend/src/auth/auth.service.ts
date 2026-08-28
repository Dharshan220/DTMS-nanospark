import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { UserStatus } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      this.logger.warn(`Failed to update lastLoginAt for user ${user.id}`);
    }

    const tokens = this.generateTokens(user.id, user.role);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      tokens,
    };
  }

  getRefreshTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      this.logger.error('JWT_REFRESH_SECRET is not set in environment');
      throw new UnauthorizedException('Server configuration error');
    }
    return secret;
  }

  getAccessTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      this.logger.error('JWT_ACCESS_SECRET is not set in environment');
      throw new UnauthorizedException('Server configuration error');
    }
    return secret;
  }

  refreshTokens(refreshToken: string): AuthTokens {
    try {
      const secret = this.getRefreshTokenSecret();
      const payload = this.jwtService.verify(refreshToken, { secret });

      return this.generateTokens(payload.sub, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getSafeUser(userId: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });

    return user
      ? { id: user.id, email: user.email, role: user.role, status: user.status }
      : null;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private generateTokens(userId: string, role: string): AuthTokens {
    const payload: TokenPayload = { sub: userId, role };

    const accessExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as any;
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as any;
    const refreshSecret = this.getRefreshTokenSecret();

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiry,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiry,
    });

    return { accessToken, refreshToken };
  }
}
