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

  async ready() {
    const dbConnected = this.prisma.connected;
    const status = dbConnected ? 'ok' : 'degraded';

    return {
      status,
      service: 'DTMS Backend',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
