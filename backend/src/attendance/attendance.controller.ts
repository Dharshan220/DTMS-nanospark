import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Faculty Attendance ─────────────────────────────────────

  @Post('faculty/attendance')
  @Roles(Role.FACULTY)
  createFacultyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.createFacultyAttendance(user.id, dto);
  }

  @Get('faculty/attendance')
  @Roles(Role.FACULTY)
  getFacultyAttendanceHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tripType') tripType?: string,
  ) {
    return this.attendanceService.getFacultyAttendanceHistory(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
      tripType,
    });
  }

  @Get('faculty/attendance/:id')
  @Roles(Role.FACULTY)
  getFacultyAttendanceById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.getFacultyAttendanceById(user.id, id);
  }

  @Patch('faculty/attendance/:id')
  @Roles(Role.FACULTY)
  updateFacultyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateFacultyAttendance(user.id, id, dto);
  }

  // ─── Admin Attendance ───────────────────────────────────────

  @Get('admin/attendance')
  @Roles(Role.ADMIN)
  getAdminAttendance(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('busId') busId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('tripType') tripType?: string,
  ) {
    return this.attendanceService.getAdminAttendance({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
      busId,
      facultyId,
      tripType,
    });
  }

  @Get('admin/attendance/:id')
  @Roles(Role.ADMIN)
  getAdminAttendanceById(@Param('id') id: string) {
    return this.attendanceService.getAdminAttendanceById(id);
  }

  @Patch('admin/attendance/:id')
  @Roles(Role.ADMIN)
  updateAdminAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAdminAttendance(id, dto);
  }
}
