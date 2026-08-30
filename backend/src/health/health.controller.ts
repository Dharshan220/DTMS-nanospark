import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Check if the application is running.' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  async check() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check', description: 'Check if the application is ready to serve traffic (database connected, etc.).' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  async ready() {
    return this.healthService.ready();
  }
}
