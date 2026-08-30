import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { Prisma, Role, UserStatus, AuditAction } from '@prisma/client';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingRegister = await this.prisma.student.findUnique({
      where: { registerNumber: dto.registerNumber },
    });
    if (existingRegister) {
      throw new ConflictException('Register number already exists');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          registerNumber: dto.registerNumber,
          name: dto.name,
          phone: dto.phone || null,
          department: dto.department || null,
          year: dto.year || null,
          section: dto.section || null,
          gender: dto.gender || null,
        },
      });

      return { user, student };
    });

    this.logger.log(`Student created: ${dto.email}`);

    await this.auditService.createLog({
      userId: result.user.id,
      userRole: Role.ADMIN,
      action: AuditAction.ENTITY_CREATE,
      resource: 'Student',
      resourceId: result.student.id,
      description: `Student created: ${dto.name} (${dto.registerNumber})`,
      metadata: { email: dto.email, registerNumber: dto.registerNumber, name: dto.name },
    });

    return this.formatResponse(result.user, result.student);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { registerNumber: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { user: { select: { id: true, email: true, status: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map((s) => this.formatResponse(s.user, s)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.formatResponse(student.user, student);
  }

  async update(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    const student = await this.prisma.student.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.department !== undefined && { department: dto.department || null }),
        ...(dto.year !== undefined && { year: dto.year || null }),
        ...(dto.section !== undefined && { section: dto.section || null }),
        ...(dto.gender !== undefined && { gender: dto.gender || null }),
      },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    return this.formatResponse(student.user, student);
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE', adminUserId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.user.update({
      where: { id: existing.userId },
      data: { status: status as UserStatus },
    });

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (adminUserId) {
      await this.auditService.createLog({
        userId: adminUserId,
        userRole: Role.ADMIN,
        action: AuditAction.STATUS_CHANGE,
        resource: 'Student',
        resourceId: id,
        description: `Student status changed to ${status}`,
        metadata: { previousStatus: existing.status, newStatus: status },
      });
    }

    return this.formatResponse(student!.user, student!);
  }

  async getProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
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
            busStop: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.formatProfileResponse(student.user, student);
  }

  private formatResponse(user: any, student: any) {
    return {
      id: student.id,
      userId: user.id,
      email: user.email,
      registerNumber: student.registerNumber,
      name: student.name,
      phone: student.phone,
      department: student.department,
      year: student.year,
      section: student.section,
      gender: student.gender,
      status: user.status,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  private formatProfileResponse(user: any, student: any) {
    const base = this.formatResponse(user, student);
    const assignment = student.transportAssignment;

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
        busStop: assignment.busStop ? {
          id: assignment.busStop.id,
          stopCode: assignment.busStop.stopCode,
          name: assignment.busStop.name,
          latitude: assignment.busStop.latitude,
          longitude: assignment.busStop.longitude,
        } : null,
        startDate: assignment.startDate,
        status: assignment.status,
      } : null,
    };
  }
}
