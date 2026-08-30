import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TransportEventService } from '../notifications/transport-event.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  CreateOverrideDto,
  ScheduleFilterDto,
} from './dto/schedules.dto';
import {
  ScheduleStatus,
  ScheduleOverrideStatus,
  TripType,
  Prisma,
  TransportEventType,
  AuditAction,
  Role,
} from '@prisma/client';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly transportEventService: TransportEventService,
  ) {}

  // ─── Admin: Create Schedule ─────────────────────────────────

  async createSchedule(adminUserId: string, dto: CreateScheduleDto) {
    await this.validateBusAndRoute(dto.busId, dto.routeId);

    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveUntil = dto.effectiveUntil ? new Date(dto.effectiveUntil) : null;

    if (effectiveUntil && effectiveUntil <= effectiveFrom) {
      throw new BadRequestException('effectiveUntil must be after effectiveFrom');
    }

    await this.checkDuplicateSchedule({
      busId: dto.busId,
      routeId: dto.routeId,
      tripType: dto.tripType as TripType,
      departureTime: dto.departureTime,
      effectiveFrom,
      effectiveUntil,
      excludeScheduleId: null,
    });

    const schedule = await this.prisma.transportSchedule.create({
      data: {
        busId: dto.busId,
        routeId: dto.routeId,
        tripType: dto.tripType as TripType,
        departureTime: dto.departureTime,
        expectedArrivalTime: dto.expectedArrivalTime,
        effectiveFrom,
        effectiveUntil,
        status: ScheduleStatus.ACTIVE,
        createdBy: adminUserId,
      },
      include: {
        bus: { select: { id: true, busNumber: true, registrationNumber: true, status: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
      },
    });

    this.logger.log(`Schedule created: ${schedule.id} by admin ${adminUserId}`);

    await this.auditService.createLog({
      userId: adminUserId,
      userRole: Role.ADMIN,
      action: AuditAction.SCHEDULE_CREATE,
      resource: 'TransportSchedule',
      resourceId: schedule.id,
      description: `Schedule created: Bus ${schedule.bus.busNumber}, Route ${schedule.route.routeCode}`,
      metadata: {
        busId: dto.busId,
        routeId: dto.routeId,
        tripType: dto.tripType,
        departureTime: dto.departureTime,
      },
    });

    await this.emitNotificationEvent({
      eventType: TransportEventType.SCHEDULE_CREATED,
      entityId: schedule.id,
      adminUserId,
      schedule,
    });

    return this.formatScheduleResponse(schedule);
  }

  // ─── Admin: List Schedules ───────────────────────────────────

  async listSchedules(query: ScheduleFilterDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TransportScheduleWhereInput = {};

    if (query.busId) where.busId = query.busId;
    if (query.routeId) where.routeId = query.routeId;
    if (query.tripType) where.tripType = query.tripType as TripType;
    if (query.status) where.status = query.status as ScheduleStatus;

    if (query.date) {
      const date = new Date(query.date);
      where.effectiveFrom = { lte: date };
      where.OR = [
        { effectiveUntil: null },
        { effectiveUntil: { gte: date } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.transportSchedule.findMany({
        where,
        include: {
          bus: { select: { id: true, busNumber: true, registrationNumber: true, status: true } },
          route: { select: { id: true, routeCode: true, routeName: true } },
          overrides: {
            where: { status: { not: ScheduleOverrideStatus.CANCELLED } },
            orderBy: { date: 'desc' },
            take: 5,
            select: {
              id: true,
              date: true,
              status: true,
              reason: true,
              replacementBus: { select: { id: true, busNumber: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.transportSchedule.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatScheduleResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Admin: Get Schedule By ID ──────────────────────────────

  async getScheduleById(scheduleId: string) {
    const schedule = await this.prisma.transportSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        bus: { select: { id: true, busNumber: true, registrationNumber: true, status: true, capacity: true } },
        route: {
          select: {
            id: true,
            routeCode: true,
            routeName: true,
            routeStops: {
              include: { busStop: { select: { id: true, name: true } } },
              orderBy: { stopOrder: 'asc' },
            },
          },
        },
        overrides: {
          orderBy: { date: 'desc' },
          include: {
            replacementBus: { select: { id: true, busNumber: true, registrationNumber: true } },
          },
        },
      },
    });

    if (!schedule) throw new NotFoundException('Schedule not found');
    return this.formatScheduleResponse(schedule, true);
  }

  // ─── Admin: Update Schedule ──────────────────────────────────

  async updateSchedule(adminUserId: string, scheduleId: string, dto: UpdateScheduleDto) {
    const existing = await this.prisma.transportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) throw new NotFoundException('Schedule not found');
    if (existing.status === ScheduleStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled schedule');
    }

    if (dto.busId || dto.routeId) {
      await this.validateBusAndRoute(
        dto.busId || existing.busId,
        dto.routeId || existing.routeId,
      );
    }

    const updateData: Prisma.TransportScheduleUpdateInput = {};

    if (dto.busId) updateData.bus = { connect: { id: dto.busId } };
    if (dto.routeId) updateData.route = { connect: { id: dto.routeId } };
    if (dto.tripType) updateData.tripType = dto.tripType as TripType;
    if (dto.departureTime) updateData.departureTime = dto.departureTime;
    if (dto.expectedArrivalTime) updateData.expectedArrivalTime = dto.expectedArrivalTime;
    if (dto.effectiveFrom) updateData.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveUntil !== undefined) {
      updateData.effectiveUntil = dto.effectiveUntil ? new Date(dto.effectiveUntil) : null;
    }
    if (dto.status) updateData.status = dto.status as ScheduleStatus;

    const updated = await this.prisma.transportSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        bus: { select: { id: true, busNumber: true, registrationNumber: true, status: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
      },
    });

    this.logger.log(`Schedule updated: ${scheduleId} by admin ${adminUserId}`);

    const timeChanged =
      (dto.departureTime && dto.departureTime !== existing.departureTime) ||
      (dto.expectedArrivalTime && dto.expectedArrivalTime !== existing.expectedArrivalTime);

    if (timeChanged) {
      await this.emitNotificationEvent({
        eventType: TransportEventType.SCHEDULE_TIME_CHANGED,
        entityId: scheduleId,
        adminUserId,
        schedule: updated,
      });
    } else {
      await this.emitNotificationEvent({
        eventType: TransportEventType.SCHEDULE_CHANGED,
        entityId: scheduleId,
        adminUserId,
        schedule: updated,
      });
    }

    return this.formatScheduleResponse(updated);
  }

  // ─── Admin: Cancel Schedule ──────────────────────────────────

  async cancelSchedule(adminUserId: string, scheduleId: string) {
    const existing = await this.prisma.transportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) throw new NotFoundException('Schedule not found');
    if (existing.status === ScheduleStatus.CANCELLED) {
      throw new BadRequestException('Schedule is already cancelled');
    }

    const updated = await this.prisma.transportSchedule.update({
      where: { id: scheduleId },
      data: { status: ScheduleStatus.CANCELLED },
      include: {
        bus: { select: { id: true, busNumber: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
      },
    });

    this.logger.log(`Schedule cancelled: ${scheduleId} by admin ${adminUserId}`);

    await this.auditService.createLog({
      userId: adminUserId,
      userRole: Role.ADMIN,
      action: AuditAction.SCHEDULE_CANCEL,
      resource: 'TransportSchedule',
      resourceId: scheduleId,
      description: `Schedule cancelled`,
      metadata: {
        busId: existing.busId,
        routeId: existing.routeId,
        tripType: existing.tripType,
      },
    });

    await this.emitNotificationEvent({
      eventType: TransportEventType.TRIP_CANCELLED,
      entityId: scheduleId,
      adminUserId,
      schedule: updated,
    });

    return this.formatScheduleResponse(updated);
  }

  // ─── Admin: Activate Schedule ────────────────────────────────

  async activateSchedule(scheduleId: string) {
    return this.setStatus(scheduleId, ScheduleStatus.ACTIVE);
  }

  // ─── Admin: Deactivate Schedule ──────────────────────────────

  async deactivateSchedule(scheduleId: string) {
    return this.setStatus(scheduleId, ScheduleStatus.INACTIVE);
  }

  // ─── Admin: Create Override (Replacement / Daily Cancel) ─────

  async createOverride(adminUserId: string, scheduleId: string, dto: CreateOverrideDto) {
    const schedule = await this.prisma.transportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.status === ScheduleStatus.CANCELLED) {
      throw new BadRequestException('Cannot override a cancelled schedule');
    }

    const overrideDate = new Date(dto.date);

    if (dto.replacementBusId) {
      const replacementBus = await this.prisma.bus.findUnique({
        where: { id: dto.replacementBusId },
      });
      if (!replacementBus) throw new NotFoundException('Replacement bus not found');
      if (replacementBus.status !== 'ACTIVE') {
        throw new BadRequestException('Replacement bus is not active');
      }
    }

    const isCancellation = !dto.replacementBusId;
    const overrideStatus = isCancellation
      ? ScheduleOverrideStatus.CANCELLED
      : ScheduleOverrideStatus.REPLACED;

    const existingOverride = await this.prisma.scheduleOverride.findUnique({
      where: { scheduleId_date: { scheduleId, date: overrideDate } },
    });

    if (existingOverride) {
      if (existingOverride.status === ScheduleOverrideStatus.CANCELLED && !isCancellation) {
        const updated = await this.prisma.scheduleOverride.update({
          where: { id: existingOverride.id },
          data: {
            replacementBusId: dto.replacementBusId || null,
            status: overrideStatus,
            reason: dto.reason || null,
            createdBy: adminUserId,
          },
          include: {
            replacementBus: { select: { id: true, busNumber: true } },
            schedule: {
              include: {
                bus: { select: { id: true, busNumber: true } },
                route: { select: { id: true, routeCode: true, routeName: true } },
              },
            },
          },
        });
        this.logger.log(`Override updated: ${updated.id} for schedule ${scheduleId}`);
        await this.emitReplacementEvent(adminUserId, updated);
        return this.formatOverrideResponse(updated);
      }
      throw new ConflictException('Override already exists for this date');
    }

    const override = await this.prisma.scheduleOverride.create({
      data: {
        scheduleId,
        date: overrideDate,
        replacementBusId: dto.replacementBusId || null,
        status: overrideStatus,
        reason: dto.reason || null,
        createdBy: adminUserId,
      },
      include: {
        replacementBus: { select: { id: true, busNumber: true } },
        schedule: {
          include: {
            bus: { select: { id: true, busNumber: true } },
            route: { select: { id: true, routeCode: true, routeName: true } },
          },
        },
      },
    });

    this.logger.log(`Override created: ${override.id} for schedule ${scheduleId}`);

    await this.emitReplacementEvent(adminUserId, override);

    return this.formatOverrideResponse(override);
  }

  // ─── Student/Faculty: Get My Schedule ───────────────────────

  async getMySchedule(userId: string, role: string) {
    let assignment: any = null;

    if (role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        include: {
          transportAssignment: {
            include: {
              bus: { select: { id: true, busNumber: true, routeId: true } },
            },
          },
        },
      });
      if (!student?.transportAssignment) {
        return { schedules: [], message: 'No active transport assignment' };
      }
      assignment = student.transportAssignment;
    } else if (role === 'FACULTY') {
      const faculty = await this.prisma.faculty.findUnique({
        where: { userId },
        include: {
          transportAssignment: {
            include: {
              bus: { select: { id: true, busNumber: true, routeId: true } },
            },
          },
        },
      });
      if (!faculty?.transportAssignment) {
        return { schedules: [], message: 'No active transport assignment' };
      }
      assignment = faculty.transportAssignment;
    }

    if (!assignment || assignment.status !== 'ACTIVE') {
      return { schedules: [], message: 'No active transport assignment' };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const schedules = await this.prisma.transportSchedule.findMany({
      where: {
        busId: assignment.busId,
        status: ScheduleStatus.ACTIVE,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: today } },
        ],
      },
      include: {
        bus: { select: { id: true, busNumber: true, registrationNumber: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
        overrides: {
          where: {
            date: {
              gte: today,
              lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { not: ScheduleOverrideStatus.CANCELLED },
          },
          include: {
            replacementBus: { select: { id: true, busNumber: true } },
          },
        },
      },
      orderBy: [{ departureTime: 'asc' }],
    });

    const effectiveSchedules = schedules.map((schedule) => {
      const todayOverride = schedule.overrides.find(
        (o) => new Date(o.date).toDateString() === now.toDateString(),
      );

      const effectiveBus = todayOverride?.replacementBus || schedule.bus;
      let tripStatus = 'SCHEDULED';

      if (todayOverride) {
        tripStatus = todayOverride.status === ScheduleOverrideStatus.REPLACED
          ? 'REPLACED'
          : 'CANCELLED';
      }

      return {
        id: schedule.id,
        tripType: schedule.tripType,
        departureTime: schedule.departureTime,
        expectedArrivalTime: schedule.expectedArrivalTime,
        effectiveBus: {
          id: effectiveBus.id,
          busNumber: effectiveBus.busNumber,
        },
        originalBus: todayOverride
          ? { id: schedule.bus.id, busNumber: schedule.bus.busNumber }
          : undefined,
        route: schedule.route,
        effectiveFrom: schedule.effectiveFrom,
        effectiveUntil: schedule.effectiveUntil,
        tripStatus,
        override: todayOverride
          ? {
              id: todayOverride.id,
              status: todayOverride.status,
              reason: todayOverride.reason,
            }
          : undefined,
      };
    });

    return {
      assignment: {
        busId: assignment.busId,
        busNumber: assignment.bus.busNumber,
      },
      schedules: effectiveSchedules,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async setStatus(scheduleId: string, status: ScheduleStatus) {
    const existing = await this.prisma.transportSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) throw new NotFoundException('Schedule not found');
    if (existing.status === status) {
      throw new BadRequestException(`Schedule is already ${status}`);
    }

    const updated = await this.prisma.transportSchedule.update({
      where: { id: scheduleId },
      data: { status },
      include: {
        bus: { select: { id: true, busNumber: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
      },
    });

    this.logger.log(`Schedule ${scheduleId} status changed to ${status}`);
    return this.formatScheduleResponse(updated);
  }

  private async validateBusAndRoute(busId: string, routeId: string) {
    const bus = await this.prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) throw new NotFoundException('Bus not found');
    if (bus.status !== 'ACTIVE') throw new BadRequestException('Bus is not active');

    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    if (route.status !== 'ACTIVE') throw new BadRequestException('Route is not active');
  }

  private async checkDuplicateSchedule(params: {
    busId: string;
    routeId: string;
    tripType: TripType;
    departureTime: string;
    effectiveFrom: Date;
    effectiveUntil: Date | null;
    excludeScheduleId: string | null;
  }) {
    const where: Prisma.TransportScheduleWhereInput = {
      busId: params.busId,
      routeId: params.routeId,
      tripType: params.tripType,
      departureTime: params.departureTime,
      status: { not: ScheduleStatus.CANCELLED },
    };

    if (params.excludeScheduleId) {
      where.id = { not: params.excludeScheduleId };
    }

    const existing = await this.prisma.transportSchedule.findFirst({ where });

    if (existing) {
      const overlaps =
        !params.effectiveUntil ||
        !existing.effectiveUntil ||
        existing.effectiveFrom <= params.effectiveUntil &&
        (!existing.effectiveUntil || params.effectiveFrom <= existing.effectiveUntil);

      if (overlaps) {
        throw new ConflictException(
          'A schedule with the same bus, route, trip type, and departure time already exists for this effective period',
        );
      }
    }
  }

  private formatScheduleResponse(schedule: any, detailed = false) {
    const response: any = {
      id: schedule.id,
      bus: schedule.bus,
      route: schedule.route,
      tripType: schedule.tripType,
      departureTime: schedule.departureTime,
      expectedArrivalTime: schedule.expectedArrivalTime,
      effectiveFrom: schedule.effectiveFrom,
      effectiveUntil: schedule.effectiveUntil,
      status: schedule.status,
      createdBy: schedule.createdBy,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };

    if (detailed) {
      if (schedule.overrides) {
        response.overrides = schedule.overrides.map((o: any) => ({
          id: o.id,
          date: o.date,
          status: o.status,
          reason: o.reason,
          replacementBus: o.replacementBus || null,
          createdBy: o.createdBy,
          createdAt: o.createdAt,
        }));
      }
    }

    return response;
  }

  private formatOverrideResponse(override: any) {
    return {
      id: override.id,
      scheduleId: override.scheduleId,
      date: override.date,
      status: override.status,
      reason: override.reason,
      replacementBus: override.replacementBus || null,
      schedule: override.schedule
        ? {
            id: override.schedule.id,
            bus: override.schedule.bus,
            route: override.schedule.route,
            tripType: override.schedule.tripType,
            departureTime: override.schedule.departureTime,
          }
        : undefined,
      createdBy: override.createdBy,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
    };
  }

  private async emitNotificationEvent(params: {
    eventType: TransportEventType;
    entityId: string;
    adminUserId: string;
    schedule: any;
  }) {
    try {
      const busNumber = params.schedule.bus?.busNumber || '';
      const routeCode = params.schedule.route?.routeCode || '';
      const routeName = params.schedule.route?.routeName || '';

      let announcementMessage = '';
      switch (params.eventType) {
        case TransportEventType.SCHEDULE_CREATED:
          announcementMessage = `New schedule created: Bus BUS-${busNumber}, Route ${routeCode} (${routeName}), ${params.schedule.tripType} trip at ${params.schedule.departureTime}.`;
          break;
        case TransportEventType.SCHEDULE_CHANGED:
          announcementMessage = `Schedule updated for Bus BUS-${busNumber}, Route ${routeCode}. Please check for changes.`;
          break;
        case TransportEventType.SCHEDULE_TIME_CHANGED:
          announcementMessage = `Schedule time changed for Bus BUS-${busNumber}, Route ${routeCode}. New departure: ${params.schedule.departureTime}.`;
          break;
        case TransportEventType.TRIP_CANCELLED:
          announcementMessage = `Trip cancelled for Bus BUS-${busNumber}, Route ${routeCode} on the affected dates.`;
          break;
      }

      await this.transportEventService.createTransportEvent({
        eventType: params.eventType,
        entityType: 'TransportSchedule',
        entityId: params.entityId,
        createdBy: params.adminUserId,
        payload: {
          newBusId: params.schedule.busId,
          newBusNumber: String(busNumber),
          routeId: params.schedule.routeId,
          routeCode,
          routeName,
          effectiveDate: params.schedule.effectiveFrom?.toISOString?.() || String(params.schedule.effectiveFrom),
          announcementTitle: `${params.eventType.replace(/_/g, ' ').toLowerCase()}`,
          announcementMessage,
          target: 'SPECIFIC_BUS',
          targetId: params.schedule.busId,
        },
        idempotencyKey: `${params.eventType}-${params.entityId}-${Date.now()}`,
      });
    } catch (err: any) {
      this.logger.error(`Failed to emit notification event: ${err.message}`);
    }
  }

  private async emitReplacementEvent(adminUserId: string, override: any) {
    try {
      const schedule = override.schedule;
      const busNumber = schedule.bus?.busNumber || '';
      const replacementNumber = override.replacementBus?.busNumber || '';

      const eventType = override.status === ScheduleOverrideStatus.REPLACED
        ? TransportEventType.BUS_REPLACED_SCHEDULE
        : TransportEventType.TRIP_CANCELLED;

      const announcementMessage = override.status === ScheduleOverrideStatus.REPLACED
        ? `Bus BUS-${busNumber} is replaced by BUS-${replacementNumber} on ${new Date(override.date).toLocaleDateString()}.`
        : `Trip for Bus BUS-${busNumber} on ${new Date(override.date).toLocaleDateString()} has been cancelled.`;

      await this.transportEventService.createTransportEvent({
        eventType,
        entityType: 'ScheduleOverride',
        entityId: override.id,
        createdBy: adminUserId,
        payload: {
          oldBusId: schedule.busId,
          oldBusNumber: String(busNumber),
          newBusId: override.replacementBusId || undefined,
          newBusNumber: replacementNumber,
          routeId: schedule.routeId,
          routeCode: schedule.route?.routeCode || '',
          routeName: schedule.route?.routeName || '',
          effectiveDate: new Date(override.date).toISOString(),
          announcementTitle: override.status === ScheduleOverrideStatus.REPLACED
            ? 'Bus Replaced'
            : 'Trip Cancelled',
          announcementMessage,
          target: 'SPECIFIC_BUS',
          targetId: schedule.busId,
        },
        idempotencyKey: `override-${override.id}-${Date.now()}`,
      });
    } catch (err: any) {
      this.logger.error(`Failed to emit replacement event: ${err.message}`);
    }
  }
}
