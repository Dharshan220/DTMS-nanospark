import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { FeedbackCategory, FeedbackStatus, Prisma, AuditAction, Role } from '@prisma/client';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Student: Create Feedback ──────────────────────────────

  async createStudentFeedback(studentUserId: string, dto: CreateFeedbackDto) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    const feedback = await this.prisma.feedback.create({
      data: {
        studentId: student.id,
        subject: dto.subject,
        message: dto.message,
        rating: dto.rating,
        category: dto.category as FeedbackCategory,
      },
    });

    this.logger.log(`Feedback created: ${feedback.id} by student ${student.id}`);
    return this.formatFeedbackResponse(feedback);
  }

  // ─── Student: View Own Feedback ────────────────────────────

  async getStudentFeedback(studentUserId: string, query: {
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

    const where: Prisma.FeedbackWhereInput = {
      studentId: student.id,
    };

    if (query.status) {
      where.status = query.status as FeedbackStatus;
    }

    const [records, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatFeedbackResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStudentFeedbackById(studentUserId: string, feedbackId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) throw new NotFoundException('Feedback not found');

    if (feedback.studentId !== student.id) {
      throw new ForbiddenException('Access denied to this feedback');
    }

    return this.formatFeedbackResponse(feedback);
  }

  // ─── Admin: Full Feedback Management ───────────────────────

  async getAdminFeedback(query: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    rating?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FeedbackWhereInput = {};

    if (query.status) where.status = query.status as FeedbackStatus;
    if (query.category) where.category = query.category as FeedbackCategory;
    if (query.rating) where.rating = query.rating;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
        { student: { registerNumber: { contains: query.search, mode: 'insensitive' } } },
        { student: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, registerNumber: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatFeedbackResponse(r, true)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminFeedbackById(feedbackId: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        student: { select: { id: true, name: true, registerNumber: true } },
      },
    });

    if (!feedback) throw new NotFoundException('Feedback not found');
    return this.formatFeedbackResponse(feedback, true);
  }

  async updateAdminFeedback(adminUserId: string, feedbackId: string, dto: UpdateFeedbackDto) {
    const existing = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!existing) throw new NotFoundException('Feedback not found');

    const updateData: Prisma.FeedbackUpdateInput = {};

    if (dto.status) {
      updateData.status = dto.status as FeedbackStatus;
      if (dto.status === 'REVIEWED' && existing.status === 'SUBMITTED') {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = adminUserId;
      }
    }

    const updated = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, registerNumber: true } },
      },
    });

    this.logger.log(`Feedback updated: ${feedbackId} by admin ${adminUserId}`);

    await this.auditService.createLog({
      userId: adminUserId,
      userRole: Role.ADMIN,
      action: AuditAction.FEEDBACK_STATUS_CHANGE,
      resource: 'Feedback',
      resourceId: feedbackId,
      description: `Feedback status changed to ${dto.status || existing.status}`,
      metadata: {
        previousStatus: existing.status,
        newStatus: dto.status || existing.status,
      },
    });

    return this.formatFeedbackResponse(updated, true);
  }

  // ─── Response Formatting ───────────────────────────────────

  private formatFeedbackResponse(feedback: any, isAdmin = false) {
    const response: any = {
      id: feedback.id,
      subject: feedback.subject,
      message: feedback.message,
      rating: feedback.rating,
      category: feedback.category,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    };

    if (isAdmin) {
      response.student = feedback.student;
      response.reviewedAt = feedback.reviewedAt;
      response.reviewedBy = feedback.reviewedBy;
    }

    return response;
  }
}
