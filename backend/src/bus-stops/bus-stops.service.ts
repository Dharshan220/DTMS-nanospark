import {
  Injectable, ConflictException, NotFoundException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBusStopDto, UpdateBusStopDto } from './dto/bus-stop.dto';
import { Prisma, EntityStatus } from '@prisma/client';

@Injectable()
export class BusStopsService {
  private readonly logger = new Logger(BusStopsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusStopDto) {
    const existing = await this.prisma.busStop.findUnique({
      where: { stopCode: dto.stopCode },
    });
    if (existing) throw new ConflictException('Stop code already exists');

    const stop = await this.prisma.busStop.create({
      data: {
        stopCode: dto.stopCode,
        name: dto.name,
        address: dto.address || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
    });

    this.logger.log(`Bus stop created: ${dto.stopCode}`);
    return stop;
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.BusStopWhereInput = {};
    if (query.search) {
      where.OR = [
        { stopCode: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [stops, total] = await Promise.all([
      this.prisma.busStop.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.busStop.count({ where }),
    ]);

    return {
      data: stops,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const stop = await this.prisma.busStop.findUnique({ where: { id } });
    if (!stop) throw new NotFoundException('Bus stop not found');
    return stop;
  }

  async update(id: string, dto: UpdateBusStopDto) {
    const existing = await this.prisma.busStop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bus stop not found');

    return this.prisma.busStop.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address || null }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude || null }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude || null }),
      },
    });
  }

  async updateStatus(id: string, status: EntityStatus) {
    const existing = await this.prisma.busStop.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Bus stop not found');

    return this.prisma.busStop.update({ where: { id }, data: { status } });
  }
}
