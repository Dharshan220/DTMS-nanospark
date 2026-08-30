import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaints.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Complaints')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ─── Student Complaints ────────────────────────────────────

  @Post('student/complaints')
  @Roles(Role.STUDENT)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Create a student complaint' })
  @ApiResponse({ status: 201, description: 'Complaint created successfully' })
  createStudentComplaint(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createStudentComplaint(user.id, dto);
  }

  @Get('student/complaints')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student complaints list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (OPEN/IN_REVIEW/RESOLVED/REJECTED)' })
  @ApiResponse({ status: 200, description: 'Student complaints retrieved' })
  getStudentComplaints(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.complaintsService.getStudentComplaints(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('student/complaints/:id')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student complaint by ID' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({ status: 200, description: 'Complaint retrieved' })
  getStudentComplaintById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.complaintsService.getStudentComplaintById(user.id, id);
  }

  // ─── Admin Complaints ──────────────────────────────────────

  @Get('admin/complaints')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin complaints list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'busId', required: false, description: 'Filter by bus ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'Admin complaints retrieved' })
  getAdminComplaints(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('busId') busId?: string,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.complaintsService.getAdminComplaints({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      category,
      priority,
      busId,
      studentId,
      startDate,
      endDate,
      search,
    });
  }

  @Get('admin/complaints/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin complaint by ID' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({ status: 200, description: 'Complaint retrieved' })
  getAdminComplaintById(@Param('id') id: string) {
    return this.complaintsService.getAdminComplaintById(id);
  }

  @Patch('admin/complaints/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiResponse({ status: 200, description: 'Complaint updated successfully' })
  updateAdminComplaint(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateAdminComplaint(user.id, id, dto);
  }
}
