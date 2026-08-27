import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBusDto, UpdateBusDto, AssignDriverDto } from './dto/bus.dto';
import { Prisma, BusStatus } from '@prisma/client';

@Injectable()
export class BusesService {
  private readonly logger = new Logger(BusesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusDto) {
    const existingBusNumber = await this.prisma.bus.findUnique({
      where: { busNumber: dto.busNumber },
    });
    if (existingBusNumber) {
      throw new ConflictException('Bus number already exists');
    }

    const existingRegNumber = await this.prisma.bus.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });
    if (existingRegNumber) {
      throw new ConflictException('Registration number already exists');
    }

    if (dto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: dto.driverId },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      if (driver.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot assign inactive driver');
      }
      const existingBusWithDriver = await this.prisma.bus.findUnique({
        where: { driverId: dto.driverId },
      });
      if (existingBusWithDriver) {
        throw new ConflictException('Driver is already assigned to another bus');
      }
    }

    const capacity = dto.capacity || 60;
    const boysCapacity = dto.boysCapacity || 0;
    const girlsCapacity = dto.girlsCapacity || 0;

    if (boysCapacity + girlsCapacity > capacity) {
      throw new BadRequestException('boysCapacity + girlsCapacity must not exceed capacity');
    }

    const bus = await this.prisma.bus.create({
      data: {
        busNumber: dto.busNumber,
        registrationNumber: dto.registrationNumber,
        capacity,
        boysCapacity: boysCapacity || null,
        girlsCapacity: girlsCapacity || null,
        driverId: dto.driverId || null,
      },
      include: {
        driver: {
          select: { id: true, driverCode: true, name: true, phone: true },
        },
      },
    });

    this.logger.log(`Bus created: Route ${dto.busNumber}`);

    return this.formatResponse(bus);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.BusWhereInput = {};

    if (query.search) {
      where.OR = [
        { busNumber: { equals: parseInt(query.search, 10) || -1 } },
        { registrationNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [buses, total] = await Promise.all([
      this.prisma.bus.findMany({
        where,
        include: {
          driver: {
            select: { id: true, driverCode: true, name: true, phone: true },
          },
        },
        skip,
        take: limit,
        orderBy: { busNumber: 'asc' },
      }),
      this.prisma.bus.count({ where }),
    ]);

    return {
      data: buses.map((b) => this.formatResponse(b)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const bus = await this.prisma.bus.findUnique({
      where: { id },
      include: {
        driver: {
          select: { id: true, driverCode: true, name: true, phone: true },
        },
      },
    });

    if (!bus) {
      throw new NotFoundException('Bus not found');
    }

    return this.formatResponse(bus);
  }

  async update(id: string, dto: UpdateBusDto) {
    const existing = await this.prisma.bus.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Bus not found');
    }

    if (dto.busNumber && dto.busNumber !== existing.busNumber) {
      const duplicate = await this.prisma.bus.findUnique({
        where: { busNumber: dto.busNumber },
      });
      if (duplicate) {
        throw new ConflictException('Bus number already exists');
      }
    }

    if (dto.registrationNumber && dto.registrationNumber !== existing.registrationNumber) {
      const duplicate = await this.prisma.bus.findUnique({
        where: { registrationNumber: dto.registrationNumber },
      });
      if (duplicate) {
        throw new ConflictException('Registration number already exists');
      }
    }

    const capacity = dto.capacity !== undefined ? dto.capacity : existing.capacity;
    const boysCapacity = dto.boysCapacity !== undefined ? dto.boysCapacity : existing.boysCapacity;
    const girlsCapacity = dto.girlsCapacity !== undefined ? dto.girlsCapacity : existing.girlsCapacity;

    if ((boysCapacity || 0) + (girlsCapacity || 0) > capacity) {
      throw new BadRequestException('boysCapacity + girlsCapacity must not exceed capacity');
    }

    const bus = await this.prisma.bus.update({
      where: { id },
      data: {
        ...(dto.busNumber !== undefined && { busNumber: dto.busNumber }),
        ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.boysCapacity !== undefined && { boysCapacity: dto.boysCapacity || null }),
        ...(dto.girlsCapacity !== undefined && { girlsCapacity: dto.girlsCapacity || null }),
      },
      include: {
        driver: {
          select: { id: true, driverCode: true, name: true, phone: true },
        },
      },
    });

    return this.formatResponse(bus);
  }

  async updateStatus(id: string, status: BusStatus) {
    const existing = await this.prisma.bus.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Bus not found');
    }

    const bus = await this.prisma.bus.update({
      where: { id },
      data: { status },
      include: {
        driver: {
          select: { id: true, driverCode: true, name: true, phone: true },
        },
      },
    });

    return this.formatResponse(bus);
  }

  async assignDriver(busId: string, dto: AssignDriverDto) {
    const bus = await this.prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) {
      throw new NotFoundException('Bus not found');
    }

    if (dto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: dto.driverId },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      if (driver.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot assign inactive driver');
      }

      if (driver.id !== bus.driverId) {
        const existingBusWithDriver = await this.prisma.bus.findUnique({
          where: { driverId: dto.driverId },
        });
        if (existingBusWithDriver) {
          throw new ConflictException('Driver is already assigned to another bus');
        }
      }
    }

    const updated = await this.prisma.bus.update({
      where: { id: busId },
      data: { driverId: dto.driverId || null },
      include: {
        driver: {
          select: { id: true, driverCode: true, name: true, phone: true },
        },
      },
    });

    this.logger.log(`Bus ${busId} driver assignment updated`);

    return this.formatResponse(updated);
  }

  private formatResponse(bus: any) {
    return {
      id: bus.id,
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      capacity: bus.capacity,
      boysCapacity: bus.boysCapacity,
      girlsCapacity: bus.girlsCapacity,
      driverId: bus.driverId,
      driver: bus.driver || null,
      status: bus.status,
      createdAt: bus.createdAt,
      updatedAt: bus.updatedAt,
    };
  }
}
