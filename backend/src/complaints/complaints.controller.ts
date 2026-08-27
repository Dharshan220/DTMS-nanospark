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
import { ThrottlerGuard } from '@nestjs/throttler';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/complaints.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ─── Student Complaints ────────────────────────────────────

  @Post('student/complaints')
  @Roles(Role.STUDENT)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  createStudentComplaint(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createStudentComplaint(user.id, dto);
  }

  @Get('student/complaints')
  @Roles(Role.STUDENT)
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
  getStudentComplaintById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.complaintsService.getStudentComplaintById(user.id, id);
  }

  // ─── Admin Complaints ──────────────────────────────────────

  @Get('admin/complaints')
  @Roles(Role.ADMIN)
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
  getAdminComplaintById(@Param('id') id: string) {
    return this.complaintsService.getAdminComplaintById(id);
  }

  @Patch('admin/complaints/:id')
  @Roles(Role.ADMIN)
  updateAdminComplaint(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateAdminComplaint(user.id, id, dto);
  }
}
