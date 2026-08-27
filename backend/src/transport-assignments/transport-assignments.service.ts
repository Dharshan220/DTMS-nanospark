import {
  Injectable, ConflictException, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AssignStudentBusDto, UpdateStudentAssignmentDto,
  AssignFacultyBusDto, UpdateFacultyAssignmentDto,
  AssignBusRouteDto,
} from './dto/assignment.dto';

@Injectable()
export class TransportAssignmentsService {
  private readonly logger = new Logger(TransportAssignmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Bus ↔ Route Assignment ──────────────────────────────────

  async assignBusRoute(busId: string, dto: AssignBusRouteDto) {
    const bus = await this.prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) throw new NotFoundException('Bus not found');

    if (dto.routeId) {
      const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } });
      if (!route) throw new NotFoundException('Route not found');
      if (route.status !== 'ACTIVE') throw new BadRequestException('Cannot assign inactive route');
    }

    const updated = await this.prisma.bus.update({
      where: { id: busId },
      data: { routeId: dto.routeId || null },
      include: {
        driver: { select: { id: true, driverCode: true, name: true, phone: true } },
        route: true,
      },
    });

    this.logger.log(`Bus ${busId} route assignment updated`);
    return updated;
  }

  // ─── Student Bus Assignment ──────────────────────────────────

  async assignStudentBus(studentId: string, dto: AssignStudentBusDto) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.status !== 'ACTIVE') throw new BadRequestException('Student is not active');

    const bus = await this.prisma.bus.findUnique({ where: { id: dto.busId } });
    if (!bus) throw new NotFoundException('Bus not found');
    if (bus.status !== 'ACTIVE') throw new BadRequestException('Bus is not active');
    if (!bus.routeId) throw new BadRequestException('Bus has no assigned route');

    const busStop = await this.prisma.busStop.findUnique({ where: { id: dto.busStopId } });
    if (!busStop) throw new NotFoundException('Bus stop not found');
    if (busStop.status !== 'ACTIVE') throw new BadRequestException('Bus stop is not active');

    const stopInRoute = await this.prisma.routeStop.findUnique({
      where: { routeId_busStopId: { routeId: bus.routeId, busStopId: dto.busStopId } },
    });
    if (!stopInRoute) throw new BadRequestException('Bus stop does not belong to the bus assigned route');

    const existing = await this.prisma.studentBusAssignment.findUnique({
      where: { studentId },
    });
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException('Student already has an active transport assignment');
    }

    const assignment = await this.prisma.studentBusAssignment.upsert({
      where: { studentId },
      update: {
        busId: dto.busId,
        busStopId: dto.busStopId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'ACTIVE',
      },
      create: {
        studentId,
        busId: dto.busId,
        busStopId: dto.busStopId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: {
        bus: {
          include: {
            driver: { select: { id: true, name: true, phone: true } },
            route: true,
          },
        },
        busStop: true,
      },
    });

    this.logger.log(`Student ${studentId} assigned to bus ${dto.busId}`);
    return this.formatStudentAssignment(assignment);
  }

  async getStudentAssignment(studentId: string) {
    const assignment = await this.prisma.studentBusAssignment.findUnique({
      where: { studentId },
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
    });

    if (!assignment) return null;
    return this.formatStudentAssignment(assignment);
  }

  async deactivateStudentAssignment(studentId: string) {
    const existing = await this.prisma.studentBusAssignment.findUnique({
      where: { studentId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    await this.prisma.studentBusAssignment.update({
      where: { studentId },
      data: { status: 'INACTIVE', endDate: new Date() },
    });

    return { message: 'Assignment deactivated' };
  }

  // ─── Faculty Bus Assignment ──────────────────────────────────

  async assignFacultyBus(facultyId: string, dto: AssignFacultyBusDto) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) throw new NotFoundException('Faculty not found');
    if (faculty.status !== 'ACTIVE') throw new BadRequestException('Faculty is not active');

    const bus = await this.prisma.bus.findUnique({ where: { id: dto.busId } });
    if (!bus) throw new NotFoundException('Bus not found');
    if (bus.status !== 'ACTIVE') throw new BadRequestException('Bus is not active');

    const existing = await this.prisma.facultyBusAssignment.findUnique({
      where: { facultyId },
    });
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException('Faculty already has an active transport assignment');
    }

    const assignment = await this.prisma.facultyBusAssignment.upsert({
      where: { facultyId },
      update: {
        busId: dto.busId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'ACTIVE',
      },
      create: {
        facultyId,
        busId: dto.busId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: {
        bus: {
          include: {
            driver: { select: { id: true, name: true, phone: true } },
            route: true,
          },
        },
      },
    });

    this.logger.log(`Faculty ${facultyId} assigned to bus ${dto.busId}`);
    return this.formatFacultyAssignment(assignment);
  }

  async getFacultyAssignment(facultyId: string) {
    const assignment = await this.prisma.facultyBusAssignment.findUnique({
      where: { facultyId },
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
      },
    });

    if (!assignment) return null;
    return this.formatFacultyAssignment(assignment);
  }

  async deactivateFacultyAssignment(facultyId: string) {
    const existing = await this.prisma.facultyBusAssignment.findUnique({
      where: { facultyId },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    await this.prisma.facultyBusAssignment.update({
      where: { facultyId },
      data: { status: 'INACTIVE', endDate: new Date() },
    });

    return { message: 'Assignment deactivated' };
  }

  // ─── Format Helpers ──────────────────────────────────────────

  private formatStudentAssignment(assignment: any) {
    return {
      id: assignment.id,
      studentId: assignment.studentId,
      bus: assignment.bus ? {
        id: assignment.bus.id,
        busNumber: assignment.bus.busNumber,
        registrationNumber: assignment.bus.registrationNumber,
        driver: assignment.bus.driver || null,
        route: assignment.bus.route ? {
          id: assignment.bus.route.id,
          routeCode: assignment.bus.route.routeCode,
          routeName: assignment.bus.route.routeName,
          stops: assignment.bus.route.routeStops?.map((rs: any) => ({
            stopOrder: rs.stopOrder,
            estimatedArrivalTime: rs.estimatedArrivalTime,
            busStop: {
              id: rs.busStop.id,
              name: rs.busStop.name,
              latitude: rs.busStop.latitude,
              longitude: rs.busStop.longitude,
            },
          })) || [],
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
      endDate: assignment.endDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  private formatFacultyAssignment(assignment: any) {
    return {
      id: assignment.id,
      facultyId: assignment.facultyId,
      bus: assignment.bus ? {
        id: assignment.bus.id,
        busNumber: assignment.bus.busNumber,
        registrationNumber: assignment.bus.registrationNumber,
        driver: assignment.bus.driver || null,
        route: assignment.bus.route ? {
          id: assignment.bus.route.id,
          routeCode: assignment.bus.route.routeCode,
          routeName: assignment.bus.route.routeName,
          stops: assignment.bus.route.routeStops?.map((rs: any) => ({
            stopOrder: rs.stopOrder,
            estimatedArrivalTime: rs.estimatedArrivalTime,
            busStop: {
              id: rs.busStop.id,
              name: rs.busStop.name,
              latitude: rs.busStop.latitude,
              longitude: rs.busStop.longitude,
            },
          })) || [],
        } : null,
      } : null,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      status: assignment.status,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }
}
