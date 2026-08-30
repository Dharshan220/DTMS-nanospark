import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateOverrideDto,
  ScheduleFilterDto,
} from './dto/schedules.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Schedules')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // ─── Admin Schedule Management ──────────────────────────────

  @Post('admin/schedules')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new schedule', description: 'Creates a transport schedule. Admin only.' })
  @ApiBody({ type: CreateScheduleDto })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  createSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.createSchedule(user.id, dto);
  }

  @Get('admin/schedules')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all schedules with filters' })
  @ApiResponse({ status: 200, description: 'Schedules list retrieved' })
  listSchedules(@Query() query: ScheduleFilterDto) {
    return this.schedulesService.listSchedules(query);
  }

  @Get('admin/schedules/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved' })
  getScheduleById(@Param('id') id: string) {
    return this.schedulesService.getScheduleById(id);
  }

  @Patch('admin/schedules/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a schedule', description: 'Updates an existing schedule. Admin only.' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateScheduleDto })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.updateSchedule(user.id, id, dto);
  }

  @Patch('admin/schedules/:id/cancel')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cancel a schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule cancelled' })
  cancelSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.schedulesService.cancelSchedule(user.id, id);
  }

  @Patch('admin/schedules/:id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate a schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule activated' })
  activateSchedule(@Param('id') id: string) {
    return this.schedulesService.activateSchedule(id);
  }

  @Patch('admin/schedules/:id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deactivated' })
  deactivateSchedule(@Param('id') id: string) {
    return this.schedulesService.deactivateSchedule(id);
  }

  // ─── Admin Override Management ──────────────────────────────

  @Post('admin/schedules/:id/overrides')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a schedule override', description: 'Creates an override for an existing schedule. Admin only.' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({ type: CreateOverrideDto })
  @ApiResponse({ status: 201, description: 'Override created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  createOverride(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateOverrideDto,
  ) {
    return this.schedulesService.createOverride(user.id, id, dto);
  }

  // ─── Student / Faculty: My Schedule ────────────────────────

  @Get('student/schedules/my')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get my student schedule' })
  @ApiResponse({ status: 200, description: 'Student schedule retrieved' })
  getMyStudentSchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.getMySchedule(user.id, user.role);
  }

  @Get('faculty/schedules/my')
  @Roles(Role.FACULTY)
  @ApiOperation({ summary: 'Get my faculty schedule' })
  @ApiResponse({ status: 200, description: 'Faculty schedule retrieved' })
  getMyFacultySchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.getMySchedule(user.id, user.role);
  }
}
