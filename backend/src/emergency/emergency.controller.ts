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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Emergency')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  // ─── Student/Faculty SOS ───────────────────────────────────

  @Post('emergency')
  @Roles(Role.STUDENT, Role.FACULTY)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Create an emergency SOS alert' })
  @ApiResponse({ status: 201, description: 'Emergency alert created' })
  createEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEmergencyDto,
  ) {
    return this.emergencyService.createEmergency(user.id, user.role, dto);
  }

  // ─── User: View Own Emergency ──────────────────────────────

  @Get('emergency/active')
  @Roles(Role.STUDENT, Role.FACULTY)
  @ApiOperation({ summary: 'Get active emergency for current user' })
  @ApiResponse({ status: 200, description: 'Active emergency retrieved' })
  getActiveEmergency(@CurrentUser() user: CurrentUserPayload) {
    return this.emergencyService.getActiveUserEmergency(user.id);
  }

  @Get('emergency')
  @Roles(Role.STUDENT, Role.FACULTY)
  @ApiOperation({ summary: 'Get user emergency history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (ACTIVE/ACKNOWLEDGED/RESOLVED/CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Emergency history retrieved' })
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
  @ApiOperation({ summary: 'Get user emergency by ID' })
  @ApiParam({ name: 'id', description: 'Emergency ID' })
  @ApiResponse({ status: 200, description: 'Emergency retrieved' })
  getUserEmergencyById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.getUserEmergencyById(user.id, id);
  }

  @Patch('emergency/:id/cancel')
  @Roles(Role.STUDENT, Role.FACULTY)
  @ApiOperation({ summary: 'Cancel an emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency ID' })
  @ApiResponse({ status: 200, description: 'Emergency cancelled' })
  cancelUserEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.cancelUserEmergency(user.id, id);
  }

  // ─── Admin Emergency Management ────────────────────────────

  @Get('admin/emergency')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin emergency list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority (CRITICAL/HIGH/MEDIUM)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by emergency type' })
  @ApiQuery({ name: 'busId', required: false, description: 'Filter by bus ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date' })
  @ApiResponse({ status: 200, description: 'Admin emergency list retrieved' })
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
  @ApiOperation({ summary: 'Get admin emergency by ID' })
  @ApiParam({ name: 'id', description: 'Emergency ID' })
  @ApiResponse({ status: 200, description: 'Emergency retrieved' })
  getAdminEmergencyById(@Param('id') id: string) {
    return this.emergencyService.getAdminEmergencyById(id);
  }

  @Patch('admin/emergency/:id/acknowledge')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Acknowledge an emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency ID' })
  @ApiResponse({ status: 200, description: 'Emergency acknowledged' })
  acknowledgeEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.emergencyService.acknowledgeEmergency(user.id, id);
  }

  @Patch('admin/emergency/:id/resolve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Resolve an emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency ID' })
  @ApiResponse({ status: 200, description: 'Emergency resolved' })
  resolveEmergency(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ResolveEmergencyDto,
  ) {
    return this.emergencyService.resolveEmergency(user.id, id, dto);
  }
}
