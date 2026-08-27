import {
  Injectable, ConflictException, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddStopToRouteDto, UpdateRouteStopDto } from './dto/route-stop.dto';

@Injectable()
export class RouteStopsService {
  private readonly logger = new Logger(RouteStopsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addStopToRoute(routeId: string, dto: AddStopToRouteDto) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const busStop = await this.prisma.busStop.findUnique({ where: { id: dto.busStopId } });
    if (!busStop) throw new NotFoundException('Bus stop not found');

    const existing = await this.prisma.routeStop.findUnique({
      where: { routeId_busStopId: { routeId, busStopId: dto.busStopId } },
    });
    if (existing) throw new ConflictException('Stop already exists in this route');

    const orderConflict = await this.prisma.routeStop.findUnique({
      where: { routeId_stopOrder: { routeId, stopOrder: dto.stopOrder } },
    });
    if (orderConflict) throw new ConflictException('Stop order already exists in this route');

    const routeStop = await this.prisma.routeStop.create({
      data: {
        routeId,
        busStopId: dto.busStopId,
        stopOrder: dto.stopOrder,
        estimatedArrivalTime: dto.estimatedArrivalTime || null,
      },
      include: { busStop: true },
    });

    this.logger.log(`Stop added to route ${routeId}`);
    return routeStop;
  }

  async getRouteStops(routeId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    return this.prisma.routeStop.findMany({
      where: { routeId },
      include: { busStop: true },
      orderBy: { stopOrder: 'asc' },
    });
  }

  async updateRouteStop(routeId: string, routeStopId: string, dto: UpdateRouteStopDto) {
    const existing = await this.prisma.routeStop.findFirst({
      where: { id: routeStopId, routeId },
    });
    if (!existing) throw new NotFoundException('Route stop not found');

    if (dto.stopOrder !== undefined && dto.stopOrder !== existing.stopOrder) {
      const orderConflict = await this.prisma.routeStop.findUnique({
        where: { routeId_stopOrder: { routeId, stopOrder: dto.stopOrder } },
      });
      if (orderConflict) throw new ConflictException('Stop order already exists in this route');
    }

    return this.prisma.routeStop.update({
      where: { id: routeStopId },
      data: {
        ...(dto.stopOrder !== undefined && { stopOrder: dto.stopOrder }),
        ...(dto.estimatedArrivalTime !== undefined && { estimatedArrivalTime: dto.estimatedArrivalTime || null }),
      },
      include: { busStop: true },
    });
  }

  async removeStopFromRoute(routeId: string, routeStopId: string) {
    const existing = await this.prisma.routeStop.findFirst({
      where: { id: routeStopId, routeId },
    });
    if (!existing) throw new NotFoundException('Route stop not found');

    await this.prisma.routeStop.delete({ where: { id: routeStopId } });
    return { message: 'Stop removed from route' };
  }

  async reorderStops(routeId: string, routeStopIds: string[]) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const stops = await this.prisma.routeStop.findMany({ where: { routeId } });
    const stopIds = new Set(stops.map((s) => s.id));

    for (const id of routeStopIds) {
      if (!stopIds.has(id)) {
        throw new BadRequestException(`Route stop ${id} does not belong to this route`);
      }
    }

    await this.prisma.$transaction(
      routeStopIds.map((id, index) =>
        this.prisma.routeStop.update({
          where: { id },
          data: { stopOrder: index + 1 },
        }),
      ),
    );

    return this.prisma.routeStop.findMany({
      where: { routeId },
      include: { busStop: true },
      orderBy: { stopOrder: 'asc' },
    });
  }
}
