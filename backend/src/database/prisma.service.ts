import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(
        'Database connection failed — server will start without database',
      );
      this.logger.warn(
        'Start PostgreSQL and restart the server to connect',
      );
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected cleanly');
    } catch (error) {
      this.logger.error('Error during database disconnection', error);
    }
  }
}
