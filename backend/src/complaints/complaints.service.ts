import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaints.dto';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Student: Create Complaint ─────────────────────────────

  async createStudentComplaint(studentUserId: string, dto: CreateComplaintDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    this.validateTransportReferences(dto);

    const complaint = await this.prisma.complaint.create({
      data: {
        studentId: student.id,
        subject: dto.subject,
        description: dto.description,
        category: dto.category as ComplaintCategory,
        priority: (dto.priority as ComplaintPriority) || ComplaintPriority.MEDIUM,
        busId: dto.busId || null,
        driverId: dto.driverId || null,
        routeId: dto.routeId || null,
        busStopId: dto.busStopId || null,
      },
      include: {
        bus: { select: { id: true, busNumber: true } },
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
        busStop: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Complaint created: ${complaint.id} by student ${student.id}`);
    return this.formatComplaintResponse(complaint);
  }

  // ─── Student: View Own Complaints ──────────────────────────

  async getStudentComplaints(studentUserId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ComplaintWhereInput = {
      studentId: student.id,
    };

    if (query.status) {
      where.status = query.status as ComplaintStatus;
    }

    const [records, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          bus: { select: { id: true, busNumber: true } },
          driver: { select: { id: true, name: true } },
          route: { select: { id: true, routeCode: true, routeName: true } },
          busStop: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatComplaintResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStudentComplaintById(studentUserId: string, complaintId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        bus: { select: { id: true, busNumber: true } },
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
        busStop: { select: { id: true, name: true } },
      },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.studentId !== student.id) {
      throw new ForbiddenException('Access denied to this complaint');
    }

    return this.formatComplaintResponse(complaint);
  }

  // ─── Admin: Full Complaint Management ──────────────────────

  async getAdminComplaints(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    busId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ComplaintWhereInput = {};

    if (query.status) where.status = query.status as ComplaintStatus;
    if (query.category) where.category = query.category as ComplaintCategory;
    if (query.priority) where.priority = query.priority as ComplaintPriority;
    if (query.busId) where.busId = query.busId;
    if (query.studentId) where.studentId = query.studentId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { student: { registerNumber: { contains: query.search, mode: 'insensitive' } } },
        { student: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, registerNumber: true } },
          bus: { select: { id: true, busNumber: true } },
          driver: { select: { id: true, name: true } },
          route: { select: { id: true, routeCode: true, routeName: true } },
          busStop: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatComplaintResponse(r, true)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminComplaintById(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        student: { select: { id: true, name: true, registerNumber: true } },
        bus: { select: { id: true, busNumber: true } },
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
        busStop: { select: { id: true, name: true } },
      },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');
    return this.formatComplaintResponse(complaint, true);
  }

  async updateAdminComplaint(adminUserId: string, complaintId: string, dto: UpdateComplaintDto) {
    const existing = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!existing) throw new NotFoundException('Complaint not found');

    if (dto.status && dto.status !== existing.status) {
      this.validateStatusTransition(existing.status, dto.status as ComplaintStatus);
    }

    const updateData: Prisma.ComplaintUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as ComplaintStatus;
      if (dto.status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = adminUserId;
      }
    }

    if (dto.priority) {
      updateData.priority = dto.priority as ComplaintPriority;
    }

    if (dto.resolutionNote !== undefined) {
      updateData.resolutionNote = dto.resolutionNote;
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, registerNumber: true } },
        bus: { select: { id: true, busNumber: true } },
        driver: { select: { id: true, name: true } },
        route: { select: { id: true, routeCode: true, routeName: true } },
        busStop: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Complaint updated: ${complaintId} by admin ${adminUserId}`);
    return this.formatComplaintResponse(updated, true);
  }

  // ─── Validation Helpers ────────────────────────────────────

  private validateTransportReferences(dto: CreateComplaintDto) {
    const hasRef = dto.busId || dto.driverId || dto.routeId || dto.busStopId;
    // Transport references are optional — no validation needed if none provided
  }

  private validateStatusTransition(current: ComplaintStatus, next: ComplaintStatus) {
    const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      OPEN: ['IN_REVIEW', 'REJECTED'],
      IN_REVIEW: ['RESOLVED', 'REJECTED'],
      RESOLVED: [],
      REJECTED: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from ${current} to ${next}`,
      );
    }
  }

  private formatComplaintResponse(complaint: any, isAdmin = false) {
    const response: any = {
      id: complaint.id,
      subject: complaint.subject,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
    };

    if (complaint.bus) response.bus = complaint.bus;
    if (complaint.driver) response.driver = complaint.driver;
    if (complaint.route) response.route = complaint.route;
    if (complaint.busStop) response.busStop = complaint.busStop;

    if (isAdmin) {
      response.student = complaint.student;
      response.resolutionNote = complaint.resolutionNote;
      response.resolvedAt = complaint.resolvedAt;
      response.resolvedBy = complaint.resolvedBy;
    } else {
      response.resolutionNote = complaint.resolutionNote;
    }

    return response;
  }
}
