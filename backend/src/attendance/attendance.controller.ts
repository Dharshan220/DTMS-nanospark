import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Faculty Attendance ─────────────────────────────────────

  @Post('faculty/attendance')
  @Roles(Role.FACULTY)
  @ApiOperation({ summary: 'Create faculty attendance record' })
  @ApiResponse({ status: 201, description: 'Attendance record created' })
  createFacultyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAttendanceDto,
  ) {
    return this.attendanceService.createFacultyAttendance(user.id, dto);
  }

  @Get('faculty/attendance')
  @Roles(Role.FACULTY)
  @ApiOperation({ summary: 'Get faculty attendance history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tripType', required: false, description: 'Filter by trip type (MORNING/EVENING)' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved' })
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
  @ApiOperation({ summary: 'Get faculty attendance by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record retrieved' })
  getFacultyAttendanceById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.attendanceService.getFacultyAttendanceById(user.id, id);
  }

  @Patch('faculty/attendance/:id')
  @Roles(Role.FACULTY)
  @ApiOperation({ summary: 'Update faculty attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record updated' })
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
  @ApiOperation({ summary: 'Get admin attendance list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'busId', required: false, description: 'Filter by bus ID' })
  @ApiQuery({ name: 'facultyId', required: false, description: 'Filter by faculty ID' })
  @ApiQuery({ name: 'tripType', required: false, description: 'Filter by trip type (MORNING/EVENING)' })
  @ApiResponse({ status: 200, description: 'Admin attendance list retrieved' })
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
  @ApiOperation({ summary: 'Get admin attendance by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record retrieved' })
  getAdminAttendanceById(@Param('id') id: string) {
    return this.attendanceService.getAdminAttendanceById(id);
  }

  @Patch('admin/attendance/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update admin attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record updated' })
  updateAdminAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAdminAttendance(id, dto);
  }
}
