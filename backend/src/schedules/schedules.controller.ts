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

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // ─── Admin Schedule Management ──────────────────────────────

  @Post('admin/schedules')
  @Roles(Role.ADMIN)
  createSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.createSchedule(user.id, dto);
  }

  @Get('admin/schedules')
  @Roles(Role.ADMIN)
  listSchedules(@Query() query: ScheduleFilterDto) {
    return this.schedulesService.listSchedules(query);
  }

  @Get('admin/schedules/:id')
  @Roles(Role.ADMIN)
  getScheduleById(@Param('id') id: string) {
    return this.schedulesService.getScheduleById(id);
  }

  @Patch('admin/schedules/:id')
  @Roles(Role.ADMIN)
  updateSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.updateSchedule(user.id, id, dto);
  }

  @Patch('admin/schedules/:id/cancel')
  @Roles(Role.ADMIN)
  cancelSchedule(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.schedulesService.cancelSchedule(user.id, id);
  }

  @Patch('admin/schedules/:id/activate')
  @Roles(Role.ADMIN)
  activateSchedule(@Param('id') id: string) {
    return this.schedulesService.activateSchedule(id);
  }

  @Patch('admin/schedules/:id/deactivate')
  @Roles(Role.ADMIN)
  deactivateSchedule(@Param('id') id: string) {
    return this.schedulesService.deactivateSchedule(id);
  }

  // ─── Admin Override Management ──────────────────────────────

  @Post('admin/schedules/:id/overrides')
  @Roles(Role.ADMIN)
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
  getMyStudentSchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.getMySchedule(user.id, user.role);
  }

  @Get('faculty/schedules/my')
  @Roles(Role.FACULTY)
  getMyFacultySchedule(@CurrentUser() user: CurrentUserPayload) {
    return this.schedulesService.getMySchedule(user.id, user.role);
  }
}
