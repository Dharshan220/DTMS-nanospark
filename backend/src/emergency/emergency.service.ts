import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateEmergencyDto, ResolveEmergencyDto } from './dto/emergency.dto';
import {
  EmergencyType,
  EmergencyPriority,
  EmergencyStatus,
  Role,
  Prisma,
} from '@prisma/client';

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create Emergency (Student/Faculty) ────────────────────

  async createEmergency(userId: string, userRole: string, dto: CreateEmergencyDto) {
    const type = (dto.type as EmergencyType) || EmergencyType.OTHER;

    // Check for duplicate active emergency
    const existingActive = await this.prisma.emergencyAlert.findFirst({
      where: {
        userId,
        status: EmergencyStatus.ACTIVE,
      },
    });

    if (existingActive) {
      this.logger.warn(`Duplicate SOS blocked for user ${userId}`);
      return this.formatUserResponse(existingActive, 'Already have an active emergency');
    }

    // Derive transport information from authenticated user
    let studentId: string | null = null;
    let facultyId: string | null = null;
    let busId: string | null = null;
    let routeId: string | null = null;

    if (userRole === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId },
        include: {
          transportAssignment: {
            where: { status: 'ACTIVE' },
            include: {
              bus: {
                include: {
                  route: true,
                },
              },
            },
          },
        },
      });

      if (student) {
        studentId = student.id;
        if (student.transportAssignment) {
          busId = student.transportAssignment.busId;
          if (student.transportAssignment.bus?.routeId) {
            routeId = student.transportAssignment.bus.routeId;
          }
        }
      }
    } else if (userRole === Role.FACULTY) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { userId },
        include: {
          transportAssignment: {
            where: { status: 'ACTIVE' },
            include: {
              bus: {
                include: {
                  route: true,
                },
              },
            },
          },
        },
      });

      if (faculty) {
        facultyId = faculty.id;
        if (faculty.transportAssignment) {
          busId = faculty.transportAssignment.busId;
          if (faculty.transportAssignment.bus?.routeId) {
            routeId = faculty.transportAssignment.bus.routeId;
          }
        }
      }
    }

    const alert = await this.prisma.emergencyAlert.create({
      data: {
        userId,
        role: userRole as Role,
        studentId,
        facultyId,
        busId,
        routeId,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        locationAccuracy: dto.locationAccuracy || null,
        message: dto.message || null,
        type,
        priority: EmergencyPriority.CRITICAL,
        status: EmergencyStatus.ACTIVE,
      },
      include: {
        bus: {
          select: { id: true, busNumber: true, registrationNumber: true },
        },
        route: {
          select: { id: true, routeCode: true, routeName: true },
        },
      },
    });

    this.logger.warn(
      `EMERGENCY SOS CREATED: ${alert.id} by ${userRole} user ${userId} type=${type}`,
    );

    return this.formatUserResponse(alert);
  }

  // ─── User: View Own Emergency History ──────────────────────

  async getUserEmergencies(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.EmergencyAlertWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status as EmergencyStatus;
    }

    const [records, total] = await Promise.all([
      this.prisma.emergencyAlert.findMany({
        where,
        include: {
          bus: {
            select: { id: true, busNumber: true },
          },
          route: {
            select: { id: true, routeCode: true, routeName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emergencyAlert.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatUserResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserEmergencyById(userId: string, emergencyId: string) {
    const alert = await this.prisma.emergencyAlert.findUnique({
      where: { id: emergencyId },
      include: {
        bus: {
          select: { id: true, busNumber: true },
        },
        route: {
          select: { id: true, routeCode: true, routeName: true },
        },
      },
    });

    if (!alert) throw new NotFoundException('Emergency alert not found');

    if (alert.userId !== userId) {
      throw new ForbiddenException('Access denied to this emergency alert');
    }

    return this.formatUserResponse(alert);
  }

  async getActiveUserEmergency(userId: string) {
    const alert = await this.prisma.emergencyAlert.findFirst({
      where: {
        userId,
        status: EmergencyStatus.ACTIVE,
      },
      include: {
        bus: {
          select: { id: true, busNumber: true },
        },
        route: {
          select: { id: true, routeCode: true, routeName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!alert) {
      return { active: false, alert: null };
    }

    return { active: true, alert: this.formatUserResponse(alert) };
  }

  async cancelUserEmergency(userId: string, emergencyId: string) {
    const alert = await this.prisma.emergencyAlert.findUnique({
      where: { id: emergencyId },
    });

    if (!alert) throw new NotFoundException('Emergency alert not found');

    if (alert.userId !== userId) {
      throw new ForbiddenException('Access denied to this emergency alert');
    }

    if (alert.status !== EmergencyStatus.ACTIVE) {
      throw new BadRequestException('Only active emergencies can be cancelled');
    }

    const updated = await this.prisma.emergencyAlert.update({
      where: { id: emergencyId },
      data: { status: EmergencyStatus.CANCELLED },
    });

    this.logger.log(`Emergency cancelled: ${emergencyId} by user ${userId}`);
    return this.formatUserResponse(updated);
  }

  // ─── Admin: Full Emergency Management ──────────────────────

  async getAdminEmergencies(query: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    type?: string;
    busId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.EmergencyAlertWhereInput = {};

    if (query.status) where.status = query.status as EmergencyStatus;
    if (query.priority) where.priority = query.priority as EmergencyPriority;
    if (query.type) where.type = query.type as EmergencyType;
    if (query.busId) where.busId = query.busId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [records, total] = await Promise.all([
      this.prisma.emergencyAlert.findMany({
        where,
        include: {
          student: {
            select: { id: true, name: true, registerNumber: true },
          },
          faculty: {
            select: { id: true, name: true, facultyId: true },
          },
          bus: {
            select: { id: true, busNumber: true, registrationNumber: true },
          },
          route: {
            select: { id: true, routeCode: true, routeName: true },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.emergencyAlert.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatAdminResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminEmergencyById(emergencyId: string) {
    const alert = await this.prisma.emergencyAlert.findUnique({
      where: { id: emergencyId },
      include: {
        student: {
          select: { id: true, name: true, registerNumber: true },
        },
        faculty: {
          select: { id: true, name: true, facultyId: true },
        },
        bus: {
          select: {
            id: true,
            busNumber: true,
            registrationNumber: true,
            driver: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        route: {
          select: { id: true, routeCode: true, routeName: true },
        },
      },
    });

    if (!alert) throw new NotFoundException('Emergency alert not found');
    return this.formatAdminResponse(alert, true);
  }

  async acknowledgeEmergency(adminUserId: string, emergencyId: string) {
    const existing = await this.prisma.emergencyAlert.findUnique({
      where: { id: emergencyId },
    });

    if (!existing) throw new NotFoundException('Emergency alert not found');

    if (existing.status !== EmergencyStatus.ACTIVE) {
      throw new BadRequestException('Only active emergencies can be acknowledged');
    }

    const updated = await this.prisma.emergencyAlert.update({
      where: { id: emergencyId },
      data: {
        status: EmergencyStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: adminUserId,
      },
    });

    this.logger.log(`Emergency acknowledged: ${emergencyId} by admin ${adminUserId}`);
    return this.formatAdminResponse(updated);
  }

  async resolveEmergency(
    adminUserId: string,
    emergencyId: string,
    dto: ResolveEmergencyDto,
  ) {
    const existing = await this.prisma.emergencyAlert.findUnique({
      where: { id: emergencyId },
    });

    if (!existing) throw new NotFoundException('Emergency alert not found');

    if (
      existing.status !== EmergencyStatus.ACTIVE &&
      existing.status !== EmergencyStatus.ACKNOWLEDGED
    ) {
      throw new BadRequestException(
        'Only active or acknowledged emergencies can be resolved',
      );
    }

    const updated = await this.prisma.emergencyAlert.update({
      where: { id: emergencyId },
      data: {
        status: EmergencyStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: adminUserId,
        resolutionNote: dto.resolutionNote || null,
      },
    });

    this.logger.log(`Emergency resolved: ${emergencyId} by admin ${adminUserId}`);
    return this.formatAdminResponse(updated);
  }

  // ─── Response Formatting ───────────────────────────────────

  private formatUserResponse(alert: any, note?: string) {
    const response: any = {
      id: alert.id,
      type: alert.type,
      priority: alert.priority,
      status: alert.status,
      message: alert.message,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };

    if (alert.latitude !== null && alert.longitude !== null) {
      response.location = {
        latitude: alert.latitude,
        longitude: alert.longitude,
        accuracy: alert.locationAccuracy || null,
      };
    }

    if (alert.bus) {
      response.bus = alert.bus;
    }

    if (alert.route) {
      response.route = alert.route;
    }

    if (note) {
      response.note = note;
    }

    if (alert.status === EmergencyStatus.CANCELLED) {
      response.cancelledAt = alert.updatedAt;
    }

    if (alert.status === EmergencyStatus.ACKNOWLEDGED) {
      response.acknowledgedAt = alert.acknowledgedAt;
    }

    if (alert.status === EmergencyStatus.RESOLVED) {
      response.resolvedAt = alert.resolvedAt;
      response.resolutionNote = alert.resolutionNote;
    }

    return response;
  }

  private formatAdminResponse(alert: any, detailed = false) {
    const response: any = {
      id: alert.id,
      role: alert.role,
      type: alert.type,
      priority: alert.priority,
      status: alert.status,
      message: alert.message,
      latitude: alert.latitude,
      longitude: alert.longitude,
      locationAccuracy: alert.locationAccuracy,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };

    if (alert.student) {
      response.student = alert.student;
    }

    if (alert.faculty) {
      response.faculty = alert.faculty;
    }

    if (alert.bus) {
      response.bus = alert.bus;
    }

    if (alert.route) {
      response.route = alert.route;
    }

    if (alert.acknowledgedAt) {
      response.acknowledgedAt = alert.acknowledgedAt;
      response.acknowledgedBy = alert.acknowledgedBy;
    }

    if (alert.resolvedAt) {
      response.resolvedAt = alert.resolvedAt;
      response.resolvedBy = alert.resolvedBy;
      response.resolutionNote = alert.resolutionNote;
    }

    return response;
  }
}
