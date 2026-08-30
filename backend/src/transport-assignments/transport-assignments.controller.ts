import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { TransportAssignmentsService } from './transport-assignments.service';
import {
  AssignStudentBusDto, UpdateStudentAssignmentDto,
  AssignFacultyBusDto, UpdateFacultyAssignmentDto,
  AssignBusRouteDto,
} from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportAssignmentsController {
  constructor(private readonly assignmentsService: TransportAssignmentsService) {}

  // ─── Bus ↔ Route (Admin) ────────────────────────────────────

  @Patch('admin/buses/:busId/route')
  @Roles(Role.ADMIN)
  assignBusRoute(@Param('busId') busId: string, @Body() dto: AssignBusRouteDto) {
    return this.assignmentsService.assignBusRoute(busId, dto);
  }

  // ─── Student Transport (Admin) ──────────────────────────────

  @Get('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  getStudentTransport(@Param('studentId') studentId: string) {
    return this.assignmentsService.getStudentAssignment(studentId);
  }

  @Post('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  assignStudentTransport(@Param('studentId') studentId: string, @Body() dto: AssignStudentBusDto) {
    return this.assignmentsService.assignStudentBus(studentId, dto);
  }

  @Patch('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  updateStudentTransport(
    @Param('studentId') studentId: string,
    @Body() dto: AssignStudentBusDto,
  ) {
    return this.assignmentsService.assignStudentBus(studentId, dto);
  }

  @Delete('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  deactivateStudentTransport(@Param('studentId') studentId: string) {
    return this.assignmentsService.deactivateStudentAssignment(studentId);
  }

  // ─── Student Profile (Student) ──────────────────────────────

  @Get('student/transport')
  @Roles(Role.STUDENT)
  getMyTransport(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.getMyStudentTransport(user.id);
  }

  // ─── Faculty Transport (Admin) ──────────────────────────────

  @Get('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  getFacultyTransport(@Param('facultyId') facultyId: string) {
    return this.assignmentsService.getFacultyAssignment(facultyId);
  }

  @Post('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  assignFacultyTransport(@Param('facultyId') facultyId: string, @Body() dto: AssignFacultyBusDto) {
    return this.assignmentsService.assignFacultyBus(facultyId, dto);
  }

  @Patch('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  updateFacultyTransport(
    @Param('facultyId') facultyId: string,
    @Body() dto: AssignFacultyBusDto,
  ) {
    return this.assignmentsService.assignFacultyBus(facultyId, dto);
  }

  @Delete('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  deactivateFacultyTransport(@Param('facultyId') facultyId: string) {
    return this.assignmentsService.deactivateFacultyAssignment(facultyId);
  }

  // ─── Faculty Profile (Faculty) ──────────────────────────────

  @Get('faculty/transport')
  @Roles(Role.FACULTY)
  getMyFacultyTransport(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.getMyFacultyTransport(user.id);
  }
}
