import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DateRangeDto, AttendanceAnalyticsDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Overview data retrieved' })
  getOverview(@Query() dto: DateRangeDto) {
    return this.analyticsService.getOverview(dto);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance analytics' })
  @ApiResponse({ status: 200, description: 'Attendance analytics retrieved' })
  getAttendanceAnalytics(@Query() dto: AttendanceAnalyticsDto) {
    return this.analyticsService.getAttendanceAnalytics(dto);
  }

  @Get('attendance/daily')
  @ApiOperation({ summary: 'Get daily attendance analytics' })
  @ApiResponse({ status: 200, description: 'Daily attendance analytics retrieved' })
  getAttendanceDaily(@Query() dto: AttendanceAnalyticsDto) {
    return this.analyticsService.getAttendanceDaily(dto);
  }

  @Get('buses')
  @ApiOperation({ summary: 'Get bus analytics' })
  @ApiResponse({ status: 200, description: 'Bus analytics retrieved' })
  getBusAnalytics() {
    return this.analyticsService.getBusAnalytics();
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get route analytics' })
  @ApiResponse({ status: 200, description: 'Route analytics retrieved' })
  getRouteAnalytics() {
    return this.analyticsService.getRouteAnalytics();
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get assignment analytics' })
  @ApiResponse({ status: 200, description: 'Assignment analytics retrieved' })
  getAssignmentAnalytics() {
    return this.analyticsService.getAssignmentAnalytics();
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Get complaint analytics' })
  @ApiResponse({ status: 200, description: 'Complaint analytics retrieved' })
  getComplaintAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getComplaintAnalytics(dto);
  }

  @Get('complaints/daily')
  @ApiOperation({ summary: 'Get daily complaint analytics' })
  @ApiResponse({ status: 200, description: 'Daily complaint analytics retrieved' })
  getComplaintDaily(@Query() dto: DateRangeDto) {
    return this.analyticsService.getComplaintDaily(dto);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback analytics' })
  @ApiResponse({ status: 200, description: 'Feedback analytics retrieved' })
  getFeedbackAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getFeedbackAnalytics(dto);
  }

  @Get('emergencies')
  @ApiOperation({ summary: 'Get emergency analytics' })
  @ApiResponse({ status: 200, description: 'Emergency analytics retrieved' })
  getEmergencyAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getEmergencyAnalytics(dto);
  }

  @Get('emergencies/summary')
  @ApiOperation({ summary: 'Get emergency summary' })
  @ApiResponse({ status: 200, description: 'Emergency summary retrieved' })
  getEmergencySummary() {
    return this.analyticsService.getEmergencySummary();
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Get schedule analytics' })
  @ApiResponse({ status: 200, description: 'Schedule analytics retrieved' })
  getScheduleAnalytics() {
    return this.analyticsService.getScheduleAnalytics();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notification analytics' })
  @ApiResponse({ status: 200, description: 'Notification analytics retrieved' })
  getNotificationAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getNotificationAnalytics(dto);
  }
}
