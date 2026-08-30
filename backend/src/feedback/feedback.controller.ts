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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Feedback')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ─── Student Feedback ──────────────────────────────────────

  @Post('student/feedback')
  @Roles(Role.STUDENT)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Create student feedback', description: 'Submit new feedback. Student only. Rate limited.' })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: student access required' })
  createStudentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createStudentFeedback(user.id, dto);
  }

  @Get('student/feedback')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student feedback list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (SUBMITTED/REVIEWED/RESOLVED)' })
  @ApiResponse({ status: 200, description: 'Student feedback retrieved' })
  getStudentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.feedbackService.getStudentFeedback(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('student/feedback/:id')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student feedback by ID' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved' })
  getStudentFeedbackById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.feedbackService.getStudentFeedbackById(user.id, id);
  }

  // ─── Admin Feedback ────────────────────────────────────────

  @Get('admin/feedback')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin feedback list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating (1-5)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'Admin feedback retrieved' })
  getAdminFeedback(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('rating') rating?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.feedbackService.getAdminFeedback({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      category,
      rating: rating ? parseInt(rating, 10) : undefined,
      startDate,
      endDate,
      search,
    });
  }

  @Get('admin/feedback/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin feedback by ID' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved' })
  getAdminFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getAdminFeedbackById(id);
  }

  @Patch('admin/feedback/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update feedback status', description: 'Update feedback status/details. Admin only.' })
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiBody({ type: UpdateFeedbackDto })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateAdminFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateAdminFeedback(user.id, id, dto);
  }
}
