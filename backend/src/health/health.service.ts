import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    return {
      status: 'ok',
      service: 'DTMS Backend',
      database: this.prisma.connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
