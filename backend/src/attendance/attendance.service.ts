import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { Prisma, TripType, AuditAction, Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Faculty: Create/Update Attendance ──────────────────────

  async createFacultyAttendance(facultyUserId: string, dto: CreateAttendanceDto) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId: facultyUserId },
      include: {
        transportAssignment: {
          where: { status: 'ACTIVE' },
          include: { bus: true },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty profile not found');
    if (!faculty.transportAssignment) {
      throw new BadRequestException('No active bus assignment found');
    }

    const bus = faculty.transportAssignment.bus;
    if (bus.status !== 'ACTIVE') {
      throw new BadRequestException('Bus is not active');
    }

    this.validatePassengerCount(dto.boysCount, dto.girlsCount, dto.totalCount);
    this.validateBusCapacity(dto.totalCount, bus.capacity);

    const attendanceDate = dto.date ? new Date(dto.date) : new Date();
    const tripType = dto.tripType as TripType;

    const existing = await this.prisma.attendance.findUnique({
      where: { busId_date_tripType: { busId: bus.id, date: attendanceDate, tripType } },
    });

    if (existing) {
      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          boysCount: dto.boysCount,
          girlsCount: dto.girlsCount,
          totalCount: dto.totalCount,
        },
        include: {
          bus: { select: { id: true, busNumber: true, capacity: true } },
          faculty: { select: { id: true, name: true } },
        },
      });
      this.logger.log(`Attendance updated: Bus ${bus.id} ${dto.tripType}`);
      return this.formatResponse(updated);
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        busId: bus.id,
        facultyId: faculty.id,
        date: attendanceDate,
        tripType,
        boysCount: dto.boysCount,
        girlsCount: dto.girlsCount,
        totalCount: dto.totalCount,
      },
      include: {
        bus: { select: { id: true, busNumber: true, capacity: true } },
        faculty: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Attendance created: Bus ${bus.id} ${dto.tripType}`);
    return this.formatResponse(attendance);
  }

  async getFacultyAttendanceHistory(facultyUserId: string, query: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    tripType?: string;
  }) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId: facultyUserId },
      include: {
        transportAssignment: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty profile not found');
    if (!faculty.transportAssignment) {
      return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {
      busId: faculty.transportAssignment.busId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.tripType) {
      where.tripType = query.tripType as TripType;
    }

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          bus: { select: { id: true, busNumber: true, capacity: true } },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFacultyAttendanceById(facultyUserId: string, attendanceId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId: facultyUserId },
      include: {
        transportAssignment: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty profile not found');

    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        bus: { select: { id: true, busNumber: true, capacity: true } },
        faculty: { select: { id: true, name: true } },
      },
    });

    if (!attendance) throw new NotFoundException('Attendance not found');

    if (faculty.transportAssignment && attendance.busId !== faculty.transportAssignment.busId) {
      throw new ForbiddenException('Access denied to this attendance record');
    }

    return this.formatResponse(attendance);
  }

  async updateFacultyAttendance(facultyUserId: string, attendanceId: string, dto: UpdateAttendanceDto) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId: facultyUserId },
      include: {
        transportAssignment: {
          where: { status: 'ACTIVE' },
          include: { bus: true },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty profile not found');
    if (!faculty.transportAssignment) {
      throw new BadRequestException('No active bus assignment found');
    }

    const existing = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!existing) throw new NotFoundException('Attendance not found');
    if (existing.busId !== faculty.transportAssignment.busId) {
      throw new ForbiddenException('Access denied to this attendance record');
    }

    const boysCount = dto.boysCount !== undefined ? dto.boysCount : existing.boysCount;
    const girlsCount = dto.girlsCount !== undefined ? dto.girlsCount : existing.girlsCount;
    const totalCount = dto.totalCount !== undefined ? dto.totalCount : existing.totalCount;

    this.validatePassengerCount(boysCount, girlsCount, totalCount);
    this.validateBusCapacity(totalCount, faculty.transportAssignment.bus.capacity);

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { boysCount, girlsCount, totalCount },
      include: {
        bus: { select: { id: true, busNumber: true, capacity: true } },
        faculty: { select: { id: true, name: true } },
      },
    });

    return this.formatResponse(updated);
  }

  // ─── Admin: Full Attendance Access ──────────────────────────

  async getAdminAttendance(query: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    busId?: string;
    facultyId?: string;
    tripType?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query.busId) where.busId = query.busId;
    if (query.facultyId) where.facultyId = query.facultyId;
    if (query.tripType) where.tripType = query.tripType as TripType;

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          bus: { select: { id: true, busNumber: true, capacity: true } },
          faculty: { select: { id: true, name: true, facultyId: true } },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminAttendanceById(attendanceId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        bus: { select: { id: true, busNumber: true, capacity: true } },
        faculty: { select: { id: true, name: true, facultyId: true } },
      },
    });

    if (!attendance) throw new NotFoundException('Attendance not found');
    return this.formatResponse(attendance);
  }

  async updateAdminAttendance(attendanceId: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { bus: true },
    });

    if (!existing) throw new NotFoundException('Attendance not found');

    const boysCount = dto.boysCount !== undefined ? dto.boysCount : existing.boysCount;
    const girlsCount = dto.girlsCount !== undefined ? dto.girlsCount : existing.girlsCount;
    const totalCount = dto.totalCount !== undefined ? dto.totalCount : existing.totalCount;

    this.validatePassengerCount(boysCount, girlsCount, totalCount);
    this.validateBusCapacity(totalCount, existing.bus.capacity);

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: { boysCount, girlsCount, totalCount },
      include: {
        bus: { select: { id: true, busNumber: true, capacity: true } },
        faculty: { select: { id: true, name: true, facultyId: true } },
      },
    });

    return this.formatResponse(updated);
  }

  // ─── Validation Helpers ─────────────────────────────────────

  private validatePassengerCount(boys: number, girls: number, total: number) {
    if (boys < 0 || girls < 0 || total < 0) {
      throw new BadRequestException('Passenger counts cannot be negative');
    }
    if (!Number.isInteger(boys) || !Number.isInteger(girls) || !Number.isInteger(total)) {
      throw new BadRequestException('Passenger counts must be integers');
    }
    if (boys + girls !== total) {
      throw new BadRequestException('totalCount must equal boysCount + girlsCount');
    }
  }

  private validateBusCapacity(total: number, capacity: number) {
    if (total > capacity) {
      throw new BadRequestException(`Total count (${total}) exceeds bus capacity (${capacity})`);
    }
  }

  private formatResponse(attendance: any) {
    return {
      id: attendance.id,
      bus: attendance.bus,
      faculty: attendance.faculty || null,
      date: attendance.date,
      tripType: attendance.tripType,
      boysCount: attendance.boysCount,
      girlsCount: attendance.girlsCount,
      totalCount: attendance.totalCount,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }
}
