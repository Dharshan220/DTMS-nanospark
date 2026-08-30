import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
}

interface CachedUser {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cache = new Map<string, CachedUser>();
  private readonly cacheTtlMs = 30_000; // 30 seconds

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const now = Date.now();
    const cached = this.cache.get(payload.sub);

    if (cached && cached.expiresAt > now) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      this.cache.delete(payload.sub);
      throw new UnauthorizedException('Invalid token');
    }

    if (user.status !== 'ACTIVE') {
      this.cache.delete(payload.sub);
      throw new UnauthorizedException('Account is inactive');
    }

    const result = { id: user.id, email: user.email, role: user.role, status: user.status };
    this.cache.set(payload.sub, { ...result, expiresAt: now + this.cacheTtlMs });
    return result;
  }
}
