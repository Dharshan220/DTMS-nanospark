import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { CreateFacultyDto, UpdateFacultyDto } from './dto/faculty.dto';
import { Prisma, Role, UserStatus, AuditAction } from '@prisma/client';

@Injectable()
export class FacultyService {
  private readonly logger = new Logger(FacultyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateFacultyDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingFacultyId = await this.prisma.faculty.findUnique({
      where: { facultyId: dto.facultyId },
    });
    if (existingFacultyId) {
      throw new ConflictException('Faculty ID already exists');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.FACULTY,
          status: UserStatus.ACTIVE,
        },
      });

      const faculty = await tx.faculty.create({
        data: {
          userId: user.id,
          facultyId: dto.facultyId,
          name: dto.name,
          phone: dto.phone || null,
          department: dto.department || null,
          designation: dto.designation || null,
        },
      });

      return { user, faculty };
    });

    this.logger.log(`Faculty created: ${dto.email}`);

    await this.auditService.createLog({
      userId: result.user.id,
      userRole: Role.ADMIN,
      action: AuditAction.ENTITY_CREATE,
      resource: 'Faculty',
      resourceId: result.faculty.id,
      description: `Faculty created: ${dto.name} (${dto.facultyId})`,
      metadata: { email: dto.email, facultyId: dto.facultyId, name: dto.name },
    });

    return this.formatResponse(result.user, result.faculty);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FacultyWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { facultyId: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [faculty, total] = await Promise.all([
      this.prisma.faculty.findMany({
        where,
        include: { user: { select: { id: true, email: true, status: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return {
      data: faculty.map((f) => this.formatResponse(f.user, f)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    return this.formatResponse(faculty.user, faculty);
  }

  async update(id: string, dto: UpdateFacultyDto) {
    const existing = await this.prisma.faculty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Faculty not found');
    }

    const faculty = await this.prisma.faculty.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.department !== undefined && { department: dto.department || null }),
        ...(dto.designation !== undefined && { designation: dto.designation || null }),
      },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    return this.formatResponse(faculty.user, faculty);
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE', adminUserId?: string) {
    const existing = await this.prisma.faculty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Faculty not found');
    }

    await this.prisma.user.update({
      where: { id: existing.userId },
      data: { status: status as UserStatus },
    });

    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (adminUserId) {
      await this.auditService.createLog({
        userId: adminUserId,
        userRole: Role.ADMIN,
        action: AuditAction.STATUS_CHANGE,
        resource: 'Faculty',
        resourceId: id,
        description: `Faculty status changed to ${status}`,
        metadata: { previousStatus: existing.status, newStatus: status },
      });
    }

    return this.formatResponse(faculty!.user, faculty!);
  }

  async getProfile(userId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, status: true } },
        transportAssignment: {
          include: {
            bus: {
              include: {
                driver: { select: { id: true, name: true, phone: true } },
                route: {
                  include: {
                    routeStops: {
                      include: { busStop: true },
                      orderBy: { stopOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty profile not found');
    }

    return this.formatProfileResponse(faculty.user, faculty);
  }

  private formatResponse(user: any, faculty: any) {
    return {
      id: faculty.id,
      userId: user.id,
      email: user.email,
      facultyId: faculty.facultyId,
      name: faculty.name,
      phone: faculty.phone,
      department: faculty.department,
      designation: faculty.designation,
      status: user.status,
      createdAt: faculty.createdAt,
      updatedAt: faculty.updatedAt,
    };
  }

  private formatProfileResponse(user: any, faculty: any) {
    const base = this.formatResponse(user, faculty);
    const assignment = faculty.transportAssignment;

    return {
      ...base,
      transport: assignment ? {
        bus: assignment.bus ? {
          id: assignment.bus.id,
          busNumber: assignment.bus.busNumber,
          registrationNumber: assignment.bus.registrationNumber,
          driver: assignment.bus.driver || null,
          route: assignment.bus.route ? {
            id: assignment.bus.route.id,
            routeCode: assignment.bus.route.routeCode,
            routeName: assignment.bus.route.routeName,
            stops: assignment.bus.route.routeStops.map((rs: any) => ({
              stopOrder: rs.stopOrder,
              estimatedArrivalTime: rs.estimatedArrivalTime,
              busStop: {
                id: rs.busStop.id,
                name: rs.busStop.name,
                latitude: rs.busStop.latitude,
                longitude: rs.busStop.longitude,
              },
            })),
          } : null,
        } : null,
      } : null,
    };
  }
}
