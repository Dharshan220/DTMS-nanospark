import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EmergencyService } from './emergency.service';
import {
  CreateEmergencyDto,
  ResolveEmergencyDto,
} from './dto/emergency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  // ─── Student/Faculty SOS ───────────────────────────────────

  @Post('emergency')
  @Roles(Role.STUDENT, Role.FACULTY)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  createEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEmergencyDto,
  ) {
    return this.emergencyService.createEmergency(user.id, user.role, dto);
  }

  // ─── User: View Own Emergency ──────────────────────────────

  @Get('emergency/active')
  @Roles(Role.STUDENT, Role.FACULTY)
  getActiveEmergency(@CurrentUser() user: CurrentUserPayload) {
    return this.emergencyService.getActiveUserEmergency(user.id);
  }

  @Get('emergency')
  @Roles(Role.STUDENT, Role.FACULTY)
  getUserEmergencies(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.emergencyService.getUserEmergencies(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('emergency/:id')
  @Roles(Role.STUDENT, Role.FACULTY)
  getUserEmergencyById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.getUserEmergencyById(user.id, id);
  }

  @Patch('emergency/:id/cancel')
  @Roles(Role.STUDENT, Role.FACULTY)
  cancelUserEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.cancelUserEmergency(user.id, id);
  }

  // ─── Admin Emergency Management ────────────────────────────

  @Get('admin/emergency')
  @Roles(Role.ADMIN)
  getAdminEmergencies(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('busId') busId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.emergencyService.getAdminEmergencies({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      priority,
      type,
      busId,
      startDate,
      endDate,
    });
  }

  @Get('admin/emergency/:id')
  @Roles(Role.ADMIN)
  getAdminEmergencyById(@Param('id') id: string) {
    return this.emergencyService.getAdminEmergencyById(id);
  }

  @Patch('admin/emergency/:id/acknowledge')
  @Roles(Role.ADMIN)
  acknowledgeEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.acknowledgeEmergency(user.id, id);
  }

  @Patch('admin/emergency/:id/resolve')
  @Roles(Role.ADMIN)
  resolveEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ResolveEmergencyDto,
  ) {
    return this.emergencyService.resolveEmergency(user.id, id, dto);
  }
}
