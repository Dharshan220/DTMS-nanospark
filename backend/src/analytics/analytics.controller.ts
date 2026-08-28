import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DateRangeDto, AttendanceAnalyticsDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('overview')
  getOverview(@Query() dto: DateRangeDto) {
    return this.analyticsService.getOverview(dto);
  }

  @Get('attendance')
  getAttendanceAnalytics(@Query() dto: AttendanceAnalyticsDto) {
    return this.analyticsService.getAttendanceAnalytics(dto);
  }

  @Get('attendance/daily')
  getAttendanceDaily(@Query() dto: AttendanceAnalyticsDto) {
    return this.analyticsService.getAttendanceDaily(dto);
  }

  @Get('buses')
  getBusAnalytics() {
    return this.analyticsService.getBusAnalytics();
  }

  @Get('routes')
  getRouteAnalytics() {
    return this.analyticsService.getRouteAnalytics();
  }

  @Get('assignments')
  getAssignmentAnalytics() {
    return this.analyticsService.getAssignmentAnalytics();
  }

  @Get('complaints')
  getComplaintAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getComplaintAnalytics(dto);
  }

  @Get('complaints/daily')
  getComplaintDaily(@Query() dto: DateRangeDto) {
    return this.analyticsService.getComplaintDaily(dto);
  }

  @Get('feedback')
  getFeedbackAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getFeedbackAnalytics(dto);
  }

  @Get('emergencies')
  getEmergencyAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getEmergencyAnalytics(dto);
  }

  @Get('emergencies/summary')
  getEmergencySummary() {
    return this.analyticsService.getEmergencySummary();
  }

  @Get('schedules')
  getScheduleAnalytics() {
    return this.analyticsService.getScheduleAnalytics();
  }

  @Get('notifications')
  getNotificationAnalytics(@Query() dto: DateRangeDto) {
    return this.analyticsService.getNotificationAnalytics(dto);
  }
}
