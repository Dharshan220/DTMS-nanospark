import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { Prisma, EntityStatus } from '@prisma/client';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRouteDto) {
    const existing = await this.prisma.route.findUnique({
      where: { routeCode: dto.routeCode },
    });
    if (existing) {
      throw new ConflictException('Route code already exists');
    }

    const route = await this.prisma.route.create({
      data: {
        routeCode: dto.routeCode,
        routeName: dto.routeName,
        description: dto.description || null,
      },
      include: {
        routeStops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    this.logger.log(`Route created: ${dto.routeCode}`);
    return this.formatResponse(route);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = {};
    if (query.search) {
      where.OR = [
        { routeCode: { contains: query.search, mode: 'insensitive' } },
        { routeName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        include: {
          routeStops: {
            include: { busStop: true },
            orderBy: { stopOrder: 'asc' },
          },
        },
        skip,
        take: limit,
        orderBy: { routeCode: 'asc' },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      data: routes.map((r) => this.formatResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        routeStops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });
    if (!route) throw new NotFoundException('Route not found');
    return this.formatResponse(route);
  }

  async update(id: string, dto: UpdateRouteDto) {
    const existing = await this.prisma.route.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Route not found');

    const route = await this.prisma.route.update({
      where: { id },
      data: {
        ...(dto.routeName !== undefined && { routeName: dto.routeName }),
        ...(dto.description !== undefined && { description: dto.description || null }),
      },
      include: {
        routeStops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    return this.formatResponse(route);
  }

  async updateStatus(id: string, status: EntityStatus) {
    const existing = await this.prisma.route.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Route not found');

    const route = await this.prisma.route.update({
      where: { id },
      data: { status },
      include: {
        routeStops: {
          include: { busStop: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    return this.formatResponse(route);
  }

  private formatResponse(route: any) {
    return {
      id: route.id,
      routeCode: route.routeCode,
      routeName: route.routeName,
      description: route.description,
      status: route.status,
      stops: route.routeStops.map((rs: any) => ({
        id: rs.id,
        stopOrder: rs.stopOrder,
        estimatedArrivalTime: rs.estimatedArrivalTime,
        busStop: {
          id: rs.busStop.id,
          stopCode: rs.busStop.stopCode,
          name: rs.busStop.name,
          latitude: rs.busStop.latitude,
          longitude: rs.busStop.longitude,
        },
      })),
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };
  }
}
