import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { Prisma, DriverStatus } from '@prisma/client';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDriverDto) {
    const existingCode = await this.prisma.driver.findUnique({
      where: { driverCode: dto.driverCode },
    });
    if (existingCode) {
      throw new ConflictException('Driver code already exists');
    }

    const existingLicense = await this.prisma.driver.findUnique({
      where: { licenseNumber: dto.licenseNumber },
    });
    if (existingLicense) {
      throw new ConflictException('License number already exists');
    }

    const driver = await this.prisma.driver.create({
      data: {
        driverCode: dto.driverCode,
        name: dto.name,
        phone: dto.phone || null,
        alternatePhone: dto.alternatePhone || null,
        licenseNumber: dto.licenseNumber,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
        experienceYears: dto.experienceYears || null,
        address: dto.address || null,
      },
      include: { bus: { select: { id: true, busNumber: true, registrationNumber: true } } },
    });

    this.logger.log(`Driver created: ${dto.driverCode}`);

    return this.formatResponse(driver);
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.DriverWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { driverCode: { contains: query.search, mode: 'insensitive' } },
        { licenseNumber: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        include: { bus: { select: { id: true, busNumber: true, registrationNumber: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.driver.count({ where }),
    ]);

    return {
      data: drivers.map((d) => this.formatResponse(d)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: { bus: { select: { id: true, busNumber: true, registrationNumber: true } } },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.formatResponse(driver);
  }

  async update(id: string, dto: UpdateDriverDto) {
    const existing = await this.prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Driver not found');
    }

    if (dto.licenseNumber && dto.licenseNumber !== existing.licenseNumber) {
      const duplicateLicense = await this.prisma.driver.findUnique({
        where: { licenseNumber: dto.licenseNumber },
      });
      if (duplicateLicense) {
        throw new ConflictException('License number already exists');
      }
    }

    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.alternatePhone !== undefined && { alternatePhone: dto.alternatePhone || null }),
        ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
        ...(dto.licenseExpiry !== undefined && {
          licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
        }),
        ...(dto.experienceYears !== undefined && { experienceYears: dto.experienceYears || null }),
        ...(dto.address !== undefined && { address: dto.address || null }),
      },
      include: { bus: { select: { id: true, busNumber: true, registrationNumber: true } } },
    });

    return this.formatResponse(driver);
  }

  async updateStatus(id: string, status: DriverStatus) {
    const existing = await this.prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Driver not found');
    }

    const driver = await this.prisma.driver.update({
      where: { id },
      data: { status },
      include: { bus: { select: { id: true, busNumber: true, registrationNumber: true } } },
    });

    return this.formatResponse(driver);
  }

  private formatResponse(driver: any) {
    return {
      id: driver.id,
      driverCode: driver.driverCode,
      name: driver.name,
      phone: driver.phone,
      alternatePhone: driver.alternatePhone,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      experienceYears: driver.experienceYears,
      address: driver.address,
      status: driver.status,
      assignedBus: driver.bus
        ? {
            id: driver.bus.id,
            busNumber: driver.bus.busNumber,
            registrationNumber: driver.bus.registrationNumber,
          }
        : null,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
