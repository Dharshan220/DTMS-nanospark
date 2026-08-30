import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
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

@ApiTags('Transport Assignments')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportAssignmentsController {
  constructor(private readonly assignmentsService: TransportAssignmentsService) {}

  // ─── Bus ↔ Route (Admin) ────────────────────────────────────

  @Patch('admin/buses/:busId/route')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign a route to a bus', description: 'Assign or update a route assignment for a bus. Admin only.' })
  @ApiParam({ name: 'busId', description: 'Bus ID' })
  @ApiBody({ type: AssignBusRouteDto })
  @ApiResponse({ status: 200, description: 'Route assigned to bus successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  assignBusRoute(@Param('busId') busId: string, @Body() dto: AssignBusRouteDto) {
    return this.assignmentsService.assignBusRoute(busId, dto);
  }

  // ─── Student Transport (Admin) ──────────────────────────────

  @Get('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get student transport assignment' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student transport assignment retrieved' })
  getStudentTransport(@Param('studentId') studentId: string) {
    return this.assignmentsService.getStudentAssignment(studentId);
  }

  @Post('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign bus to student', description: 'Create a transport assignment for a student. Admin only.' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiBody({ type: AssignStudentBusDto })
  @ApiResponse({ status: 201, description: 'Bus assigned to student successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  assignStudentTransport(@Param('studentId') studentId: string, @Body() dto: AssignStudentBusDto) {
    return this.assignmentsService.assignStudentBus(studentId, dto);
  }

  @Patch('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update student transport assignment', description: 'Update an existing transport assignment. Admin only.' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiBody({ type: AssignStudentBusDto })
  @ApiResponse({ status: 200, description: 'Student transport assignment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStudentTransport(
    @Param('studentId') studentId: string,
    @Body() dto: AssignStudentBusDto,
  ) {
    return this.assignmentsService.assignStudentBus(studentId, dto);
  }

  @Delete('admin/students/:studentId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate student transport assignment' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student transport assignment deactivated' })
  deactivateStudentTransport(@Param('studentId') studentId: string) {
    return this.assignmentsService.deactivateStudentAssignment(studentId);
  }

  // ─── Student Profile (Student) ──────────────────────────────

  @Get('student/transport')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get my transport assignment' })
  @ApiResponse({ status: 200, description: 'My transport assignment retrieved' })
  getMyTransport(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.getMyStudentTransport(user.id);
  }

  // ─── Faculty Transport (Admin) ──────────────────────────────

  @Get('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get faculty transport assignment' })
  @ApiParam({ name: 'facultyId', description: 'Faculty ID' })
  @ApiResponse({ status: 200, description: 'Faculty transport assignment retrieved' })
  getFacultyTransport(@Param('facultyId') facultyId: string) {
    return this.assignmentsService.getFacultyAssignment(facultyId);
  }

  @Post('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign bus to faculty', description: 'Create a transport assignment for a faculty member. Admin only.' })
  @ApiParam({ name: 'facultyId', description: 'Faculty ID' })
  @ApiBody({ type: AssignFacultyBusDto })
  @ApiResponse({ status: 201, description: 'Bus assigned to faculty successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  assignFacultyTransport(@Param('facultyId') facultyId: string, @Body() dto: AssignFacultyBusDto) {
    return this.assignmentsService.assignFacultyBus(facultyId, dto);
  }

  @Patch('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update faculty transport assignment', description: 'Update an existing faculty transport assignment. Admin only.' })
  @ApiParam({ name: 'facultyId', description: 'Faculty ID' })
  @ApiBody({ type: AssignFacultyBusDto })
  @ApiResponse({ status: 200, description: 'Faculty transport assignment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateFacultyTransport(
    @Param('facultyId') facultyId: string,
    @Body() dto: AssignFacultyBusDto,
  ) {
    return this.assignmentsService.assignFacultyBus(facultyId, dto);
  }

  @Delete('admin/faculty/:facultyId/transport')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate faculty transport assignment' })
  @ApiParam({ name: 'facultyId', description: 'Faculty ID' })
  @ApiResponse({ status: 200, description: 'Faculty transport assignment deactivated' })
  deactivateFacultyTransport(@Param('facultyId') facultyId: string) {
    return this.assignmentsService.deactivateFacultyAssignment(facultyId);
  }

  // ─── Faculty Profile (Faculty) ──────────────────────────────

  @Get('faculty/transport')
  @Roles(Role.FACULTY)
  @ApiOperation({ summary: 'Get my faculty transport assignment' })
  @ApiResponse({ status: 200, description: 'My faculty transport assignment retrieved' })
  getMyFacultyTransport(@CurrentUser() user: CurrentUserPayload) {
    return this.assignmentsService.getMyFacultyTransport(user.id);
  }
}
