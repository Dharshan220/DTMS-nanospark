import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DateRangeDto, AttendanceAnalyticsDto } from './dto/analytics.dto';
import {
  ComplaintStatus,
  ComplaintCategory,
  FeedbackStatus,
  EmergencyStatus,
  EmergencyType,
  Role,
  ScheduleStatus,
  ScheduleOverrideStatus,
  NotificationStatus,
  NotificationChannel,
  TripType,
  AssignmentStatus,
} from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private validateDateRange(dto: DateRangeDto): { from: Date; to: Date } {
    const now = new Date();
    const from = dto.from ? new Date(dto.from) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = dto.to ? new Date(dto.to + 'T23:59:59.999Z') : now;

    if (from > to) {
      throw new BadRequestException('from date must not be after to date');
    }

    const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
    if (to.getTime() - from.getTime() > maxRangeMs) {
      throw new BadRequestException('Date range must not exceed 1 year');
    }

    return { from, to };
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // ─── Dashboard Overview ──────────────────────────────────────

  async getDashboard() {
    const [
      totalStudents,
      totalFaculty,
      totalBuses,
      activeBuses,
      totalRoutes,
      activeStudentAssignments,
      activeFacultyAssignments,
      todayAttendance,
      activeEmergencies,
      openComplaints,
      pendingFeedback,
      activeSchedules,
      cancelledSchedules,
      totalNotifications,
      failedNotifications,
    ] = await Promise.all([
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.faculty.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bus.count(),
      this.prisma.bus.count({ where: { status: 'ACTIVE' } }),
      this.prisma.route.count(),
      this.prisma.studentBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
      this.prisma.facultyBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: this.startOfDay(new Date()),
            lt: new Date(this.startOfDay(new Date()).getTime() + 86400000),
          },
        },
        select: { boysCount: true, girlsCount: true, totalCount: true },
      }),
      this.prisma.emergencyAlert.count({ where: { status: EmergencyStatus.ACTIVE } }),
      this.prisma.complaint.count({
        where: { status: { in: [ComplaintStatus.OPEN, ComplaintStatus.IN_REVIEW] } },
      }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.SUBMITTED } }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.ACTIVE } }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.CANCELLED } }),
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { status: NotificationStatus.FAILED } }),
    ]);

    const todayPresent = todayAttendance.reduce((sum, a) => sum + a.totalCount, 0);
    const todayBoys = todayAttendance.reduce((sum, a) => sum + a.boysCount, 0);
    const todayGirls = todayAttendance.reduce((sum, a) => sum + a.girlsCount, 0);

    return {
      users: {
        students: totalStudents,
        faculty: totalFaculty,
      },
      transport: {
        buses: totalBuses,
        activeBuses,
        routes: totalRoutes,
        activeStudentAssignments,
        activeFacultyAssignments,
      },
      attendance: {
        today: {
          records: todayAttendance.length,
          present: todayPresent,
          boys: todayBoys,
          girls: todayGirls,
        },
      },
      operations: {
        activeEmergencies,
        openComplaints,
        pendingFeedback,
      },
      schedules: {
        active: activeSchedules,
        cancelled: cancelledSchedules,
      },
      notifications: {
        total: totalNotifications,
        failed: failedNotifications,
      },
    };
  }

  // ─── Overview with Date Range ────────────────────────────────

  async getOverview(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const [
      totalStudents,
      totalFaculty,
      totalBuses,
      activeBuses,
      totalRoutes,
      activeStudentAssignments,
      activeFacultyAssignments,
      attendanceStats,
      activeEmergencies,
      openComplaints,
      pendingFeedback,
      activeSchedules,
      cancelledSchedules,
      totalNotifications,
      failedNotifications,
    ] = await Promise.all([
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.faculty.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bus.count(),
      this.prisma.bus.count({ where: { status: 'ACTIVE' } }),
      this.prisma.route.count(),
      this.prisma.studentBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
      this.prisma.facultyBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
      this.prisma.attendance.aggregate({
        where: { date: { gte: from, lte: to } },
        _sum: { boysCount: true, girlsCount: true, totalCount: true },
        _count: true,
        _avg: { totalCount: true },
      }),
      this.prisma.emergencyAlert.count({
        where: {
          status: EmergencyStatus.ACTIVE,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.complaint.count({
        where: {
          status: { in: [ComplaintStatus.OPEN, ComplaintStatus.IN_REVIEW] },
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.feedback.count({
        where: {
          status: FeedbackStatus.SUBMITTED,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.ACTIVE } }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.CANCELLED } }),
      this.prisma.notification.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.notification.count({
        where: { status: NotificationStatus.FAILED, createdAt: { gte: from, lte: to } },
      }),
    ]);

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      users: {
        students: totalStudents,
        faculty: totalFaculty,
      },
      transport: {
        buses: totalBuses,
        activeBuses,
        routes: totalRoutes,
        activeStudentAssignments,
        activeFacultyAssignments,
      },
      attendance: {
        totalRecords: attendanceStats._count,
        totalPassengers: attendanceStats._sum.totalCount || 0,
        totalBoys: attendanceStats._sum.boysCount || 0,
        totalGirls: attendanceStats._sum.girlsCount || 0,
        averagePassengers: attendanceStats._avg.totalCount
          ? Math.round(attendanceStats._avg.totalCount * 100) / 100
          : null,
      },
      operations: {
        activeEmergencies,
        openComplaints,
        pendingFeedback,
      },
      schedules: {
        active: activeSchedules,
        cancelled: cancelledSchedules,
      },
      notifications: {
        total: totalNotifications,
        failed: failedNotifications,
      },
    };
  }

  // ─── Attendance Analytics ────────────────────────────────────

  async getAttendanceAnalytics(dto: AttendanceAnalyticsDto) {
    const { from, to } = this.validateDateRange(dto);

    const where: Record<string, unknown> = {
      date: { gte: from, lte: to },
    };

    if (dto.busId) where.busId = dto.busId;
    if (dto.routeId) {
      const busesOnRoute = await this.prisma.bus.findMany({
        where: { routeId: dto.routeId },
        select: { id: true },
      });
      where.busId = { in: busesOnRoute.map((b) => b.id) };
    }

    const stats = await this.prisma.attendance.aggregate({
      where,
      _sum: { boysCount: true, girlsCount: true, totalCount: true },
      _count: true,
      _avg: { totalCount: true, boysCount: true, girlsCount: true },
    });

    const maxMin = await this.prisma.attendance.aggregate({
      where,
      _max: { totalCount: true },
      _min: { totalCount: true },
    });

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      totalRecords: stats._count,
      totalPassengers: stats._sum.totalCount || 0,
      totalBoys: stats._sum.boysCount || 0,
      totalGirls: stats._sum.girlsCount || 0,
      averagePassengers: stats._avg.totalCount
        ? Math.round(stats._avg.totalCount * 100) / 100
        : null,
      averageBoys: stats._avg.boysCount
        ? Math.round(stats._avg.boysCount * 100) / 100
        : null,
      averageGirls: stats._avg.girlsCount
        ? Math.round(stats._avg.girlsCount * 100) / 100
        : null,
      maxPassengers: maxMin._max.totalCount ?? null,
      minPassengers: maxMin._min.totalCount ?? null,
    };
  }

  // ─── Daily Attendance Trend ──────────────────────────────────

  async getAttendanceDaily(dto: AttendanceAnalyticsDto) {
    const { from, to } = this.validateDateRange(dto);

    const where: Record<string, unknown> = {
      date: { gte: from, lte: to },
    };

    if (dto.busId) where.busId = dto.busId;
    if (dto.routeId) {
      const busesOnRoute = await this.prisma.bus.findMany({
        where: { routeId: dto.routeId },
        select: { id: true },
      });
      where.busId = { in: busesOnRoute.map((b) => b.id) };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      select: {
        date: true,
        boysCount: true,
        girlsCount: true,
        totalCount: true,
      },
      orderBy: { date: 'asc' },
    });

    const dailyMap = new Map<
      string,
      { date: string; boys: number; girls: number; total: number; records: number }
    >();

    for (const r of records) {
      const key = this.startOfDay(new Date(r.date)).toISOString().slice(0, 10);
      const existing = dailyMap.get(key);
      if (existing) {
        existing.boys += r.boysCount;
        existing.girls += r.girlsCount;
        existing.total += r.totalCount;
        existing.records += 1;
      } else {
        dailyMap.set(key, {
          date: key,
          boys: r.boysCount,
          girls: r.girlsCount,
          total: r.totalCount,
          records: 1,
        });
      }
    }

    return Array.from(dailyMap.values());
  }

  // ─── Bus Analytics ───────────────────────────────────────────

  async getBusAnalytics() {
    const buses = await this.prisma.bus.findMany({
      select: {
        id: true,
        busNumber: true,
        registrationNumber: true,
        capacity: true,
        status: true,
        route: { select: { id: true, routeCode: true, routeName: true } },
        _count: {
          select: {
            studentAssignments: { where: { status: AssignmentStatus.ACTIVE } },
            facultyAssignments: { where: { status: AssignmentStatus.ACTIVE } },
            attendances: true,
          },
        },
      },
      orderBy: { busNumber: 'asc' },
    });

    return buses.map((bus) => ({
      busId: bus.id,
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      capacity: bus.capacity,
      status: bus.status,
      route: bus.route,
      assignedStudents: bus._count.studentAssignments,
      assignedFaculty: bus._count.facultyAssignments,
      attendanceCount: bus._count.attendances,
      utilizationPercentage:
        bus.capacity > 0
          ? Math.round(((bus._count.studentAssignments + bus._count.facultyAssignments) / bus.capacity) * 10000) / 100
          : null,
    }));
  }

  // ─── Route Analytics ─────────────────────────────────────────

  async getRouteAnalytics() {
    const routes = await this.prisma.route.findMany({
      select: {
        id: true,
        routeCode: true,
        routeName: true,
        status: true,
        buses: {
          select: { id: true },
        },
        _count: {
          select: {
            complaints: true,
            emergencyAlerts: true,
          },
        },
      },
      orderBy: { routeCode: 'asc' },
    });

    const routeIds = routes.map((r) => r.id);
    const busIds = routes.flatMap((r) => r.buses.map((b) => b.id));

    const [studentCounts, facultyCounts, attendanceAggs] = await Promise.all([
      this.prisma.studentBusAssignment.groupBy({
        by: ['busId'],
        where: { busId: { in: busIds }, status: AssignmentStatus.ACTIVE },
        _count: true,
      }),
      this.prisma.facultyBusAssignment.groupBy({
        by: ['busId'],
        where: { busId: { in: busIds }, status: AssignmentStatus.ACTIVE },
        _count: true,
      }),
      this.prisma.attendance.groupBy({
        by: ['busId'],
        where: { busId: { in: busIds } },
        _sum: { totalCount: true, boysCount: true, girlsCount: true },
        _count: true,
      }),
    ]);

    const busToRoute = new Map<string, string>();
    for (const route of routes) {
      for (const bus of route.buses) {
        busToRoute.set(bus.id, route.id);
      }
    }

    const routeStudentCounts = new Map<string, number>();
    const routeFacultyCounts = new Map<string, number>();
    const routeAttendance = new Map<string, { total: number; boys: number; girls: number; count: number }>();

    for (const sc of studentCounts) {
      const rid = busToRoute.get(sc.busId);
      if (rid) routeStudentCounts.set(rid, (routeStudentCounts.get(rid) || 0) + sc._count);
    }
    for (const fc of facultyCounts) {
      const rid = busToRoute.get(fc.busId);
      if (rid) routeFacultyCounts.set(rid, (routeFacultyCounts.get(rid) || 0) + fc._count);
    }
    for (const ag of attendanceAggs) {
      const rid = busToRoute.get(ag.busId);
      if (rid) {
        const existing = routeAttendance.get(rid) || { total: 0, boys: 0, girls: 0, count: 0 };
        existing.total += ag._sum.totalCount || 0;
        existing.boys += ag._sum.boysCount || 0;
        existing.girls += ag._sum.girlsCount || 0;
        existing.count += ag._count;
        routeAttendance.set(rid, existing);
      }
    }

    return routes.map((route) => ({
      routeId: route.id,
      routeCode: route.routeCode,
      routeName: route.routeName,
      status: route.status,
      totalBuses: route.buses.length,
      assignedStudents: routeStudentCounts.get(route.id) || 0,
      assignedFaculty: routeFacultyCounts.get(route.id) || 0,
      totalPassengers: routeAttendance.get(route.id)?.total || 0,
      attendanceCount: routeAttendance.get(route.id)?.count || 0,
      complaints: route._count.complaints,
      emergencies: route._count.emergencyAlerts,
    }));
  }

  // ─── Assignment Analytics ────────────────────────────────────

  async getAssignmentAnalytics() {
    const [
      totalStudents,
      assignedStudents,
      totalFaculty,
      assignedFaculty,
    ] = await Promise.all([
      this.prisma.student.count({ where: { status: 'ACTIVE' } }),
      this.prisma.studentBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
      this.prisma.faculty.count({ where: { status: 'ACTIVE' } }),
      this.prisma.facultyBusAssignment.count({ where: { status: AssignmentStatus.ACTIVE } }),
    ]);

    return {
      students: {
        total: totalStudents,
        assigned: assignedStudents,
        unassigned: totalStudents - assignedStudents,
      },
      faculty: {
        total: totalFaculty,
        assigned: assignedFaculty,
        unassigned: totalFaculty - assignedFaculty,
      },
    };
  }

  // ─── Complaint Analytics ─────────────────────────────────────

  async getComplaintAnalytics(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const where = { createdAt: { gte: from, lte: to } };

    const [total, open, inReview, resolved, rejected] = await Promise.all([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.count({ where: { ...where, status: ComplaintStatus.OPEN } }),
      this.prisma.complaint.count({ where: { ...where, status: ComplaintStatus.IN_REVIEW } }),
      this.prisma.complaint.count({ where: { ...where, status: ComplaintStatus.RESOLVED } }),
      this.prisma.complaint.count({ where: { ...where, status: ComplaintStatus.REJECTED } }),
    ]);

    const byCategory = await this.prisma.complaint.groupBy({
      by: ['category'],
      where,
      _count: true,
    });

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      total,
      open,
      inReview,
      resolved,
      rejected,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }

  // ─── Complaint Daily Trend ───────────────────────────────────

  async getComplaintDaily(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const records = await this.prisma.complaint.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { date: string; total: number; resolved: number; open: number }>();

    for (const r of records) {
      const key = this.startOfDay(new Date(r.createdAt)).toISOString().slice(0, 10);
      const existing = dailyMap.get(key);
      if (existing) {
        existing.total += 1;
        if (r.status === ComplaintStatus.RESOLVED) existing.resolved += 1;
        if (r.status === ComplaintStatus.OPEN) existing.open += 1;
      } else {
        dailyMap.set(key, {
          date: key,
          total: 1,
          resolved: r.status === ComplaintStatus.RESOLVED ? 1 : 0,
          open: r.status === ComplaintStatus.OPEN ? 1 : 0,
        });
      }
    }

    return Array.from(dailyMap.values());
  }

  // ─── Feedback Analytics ──────────────────────────────────────

  async getFeedbackAnalytics(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const where = { createdAt: { gte: from, lte: to } };

    const [total, submitted, reviewed, resolved] = await Promise.all([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.count({ where: { ...where, status: FeedbackStatus.SUBMITTED } }),
      this.prisma.feedback.count({ where: { ...where, status: FeedbackStatus.REVIEWED } }),
      this.prisma.feedback.count({ where: { ...where, status: FeedbackStatus.RESOLVED } }),
    ]);

    const ratingStats = await this.prisma.feedback.aggregate({
      where,
      _avg: { rating: true },
      _min: { rating: true },
      _max: { rating: true },
    });

    const byCategory = await this.prisma.feedback.groupBy({
      by: ['category'],
      where,
      _count: true,
    });

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      total,
      submitted,
      reviewed,
      resolved,
      averageRating: ratingStats._avg.rating
        ? Math.round(ratingStats._avg.rating * 100) / 100
        : null,
      minRating: ratingStats._min.rating ?? null,
      maxRating: ratingStats._max.rating ?? null,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }

  // ─── Emergency Analytics ─────────────────────────────────────

  async getEmergencyAnalytics(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const where = { createdAt: { gte: from, lte: to } };

    const [total, active, acknowledged, resolvedCount, cancelled] = await Promise.all([
      this.prisma.emergencyAlert.count({ where }),
      this.prisma.emergencyAlert.count({ where: { ...where, status: EmergencyStatus.ACTIVE } }),
      this.prisma.emergencyAlert.count({ where: { ...where, status: EmergencyStatus.ACKNOWLEDGED } }),
      this.prisma.emergencyAlert.count({ where: { ...where, status: EmergencyStatus.RESOLVED } }),
      this.prisma.emergencyAlert.count({ where: { ...where, status: EmergencyStatus.CANCELLED } }),
    ]);

    const byType = await this.prisma.emergencyAlert.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    const byRole = await this.prisma.emergencyAlert.groupBy({
      by: ['role'],
      where,
      _count: true,
    });

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      total,
      active,
      acknowledged,
      resolved: resolvedCount,
      cancelled,
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
      })),
      byRole: byRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
    };
  }

  // ─── Emergency Summary ───────────────────────────────────────

  async getEmergencySummary() {
    const todayStart = this.startOfDay(new Date());

    const [active, critical, acknowledged, resolvedToday] = await Promise.all([
      this.prisma.emergencyAlert.count({ where: { status: EmergencyStatus.ACTIVE } }),
      this.prisma.emergencyAlert.count({
        where: { status: EmergencyStatus.ACTIVE, priority: 'CRITICAL' as any },
      }),
      this.prisma.emergencyAlert.count({ where: { status: EmergencyStatus.ACKNOWLEDGED } }),
      this.prisma.emergencyAlert.count({
        where: {
          status: EmergencyStatus.RESOLVED,
          resolvedAt: { gte: todayStart },
        },
      }),
    ]);

    return {
      active,
      critical,
      acknowledged,
      resolvedToday,
    };
  }

  // ─── Schedule Analytics ──────────────────────────────────────

  async getScheduleAnalytics() {
    const [active, inactive, cancelled] = await Promise.all([
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.ACTIVE } }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.INACTIVE } }),
      this.prisma.transportSchedule.count({ where: { status: ScheduleStatus.CANCELLED } }),
    ]);

    const overrideStats = await this.prisma.scheduleOverride.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      active,
      inactive,
      cancelled,
      overrides: {
        scheduled: overrideStats.find((o) => o.status === ScheduleOverrideStatus.SCHEDULED)?._count || 0,
        cancelled: overrideStats.find((o) => o.status === ScheduleOverrideStatus.CANCELLED)?._count || 0,
        replaced: overrideStats.find((o) => o.status === ScheduleOverrideStatus.REPLACED)?._count || 0,
      },
    };
  }

  // ─── Notification Analytics ──────────────────────────────────

  async getNotificationAnalytics(dto: DateRangeDto) {
    const { from, to } = this.validateDateRange(dto);

    const where = { createdAt: { gte: from, lte: to } };

    const [
      total,
      whatsappCount,
      inAppCount,
      pending,
      sent,
      delivered,
      read,
      failed,
    ] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, channel: NotificationChannel.WHATSAPP } }),
      this.prisma.notification.count({ where: { ...where, channel: NotificationChannel.IN_APP } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.PENDING } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.SENT } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.DELIVERED } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.READ } }),
      this.prisma.notification.count({ where: { ...where, status: NotificationStatus.FAILED } }),
    ]);

    const totalAttempted = sent + delivered + read + failed;
    const successCount = sent + delivered + read;
    const deliverySuccessRate = totalAttempted > 0
      ? Math.round((successCount / totalAttempted) * 10000) / 100
      : null;

    return {
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      total,
      byChannel: {
        whatsapp: whatsappCount,
        inApp: inAppCount,
      },
      byStatus: {
        pending,
        sent,
        delivered,
        read,
        failed,
      },
      deliverySuccessRate,
    };
  }
}
