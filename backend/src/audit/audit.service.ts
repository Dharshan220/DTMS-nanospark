import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction, Role, Prisma } from '@prisma/client';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface CreateAuditLogParams {
  userId: string;
  userRole: Role;
  userName?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  endpoint?: string;
  httpMethod?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          userRole: params.userRole,
          userName: params.userName || null,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId || null,
          description: params.description || null,
          metadata: params.metadata || Prisma.JsonNull,
          ipAddress: params.ipAddress || null,
          endpoint: params.endpoint || null,
          httpMethod: params.httpMethod || null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async findAll(query: AuditQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId) where.userId = query.userId;
    if (query.userRole) where.userRole = query.userRole;
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = { contains: query.resource, mode: 'insensitive' };
    if (query.resourceId) where.resourceId = query.resourceId;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { userName: { contains: query.search, mode: 'insensitive' } },
        { resource: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { endpoint: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) return null;
    return log;
  }
}
