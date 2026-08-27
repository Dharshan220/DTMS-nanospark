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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ─── Student Feedback ──────────────────────────────────────

  @Post('student/feedback')
  @Roles(Role.STUDENT)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(ThrottlerGuard)
  createStudentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createStudentFeedback(user.id, dto);
  }

  @Get('student/feedback')
  @Roles(Role.STUDENT)
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
  getStudentFeedbackById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.feedbackService.getStudentFeedbackById(user.id, id);
  }

  // ─── Admin Feedback ────────────────────────────────────────

  @Get('admin/feedback')
  @Roles(Role.ADMIN)
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
  getAdminFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getAdminFeedbackById(id);
  }

  @Patch('admin/feedback/:id')
  @Roles(Role.ADMIN)
  updateAdminFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateAdminFeedback(user.id, id, dto);
  }
}
