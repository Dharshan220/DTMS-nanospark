import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { TransportEventService } from './transport-event.service';
import { NotificationFilterDto, CreateAnnouncementDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Logger } from '@nestjs/common';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly transportEventService: TransportEventService,
  ) {}

  // ─── User: View Own Notifications ──────────────────────────

  @Get('notifications')
  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (PENDING/SENT/DELIVERED/READ/FAILED)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved' })
  getUserNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationService.getUserNotifications(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      type,
    });
  }

  @Patch('notifications/read-all')
  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch('notifications/:id/read')
  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }

  // ─── Admin: Notification Management ────────────────────────

  @Get('admin/notifications')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin notifications list' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'channel', required: false, description: 'Filter by channel (WHATSAPP/IN_APP)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by delivery status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'Admin notifications retrieved' })
  getAdminNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('channel') channel?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.notificationService.getAdminNotifications({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      channel,
      type,
      status,
      startDate,
      endDate,
      search,
    });
  }

  @Post('admin/notifications/announcement')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a transport announcement', description: 'Send announcement to students/faculty. Admin only.' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  createAnnouncement(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.transportEventService.createTransportEvent({
      eventType: 'TRANSPORT_ANNOUNCEMENT' as any,
      entityType: 'announcement',
      entityId: 'manual',
      createdBy: user.id,
      payload: {
        target: dto.target as any,
        targetId: dto.targetId,
        announcementTitle: dto.title,
        announcementMessage: dto.message,
      },
    });
  }

  @Post('admin/notifications/whatsapp/test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Send a test WhatsApp notification', description: 'Send a test message to verify WhatsApp integration. Admin only.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number to send test message to', example: '+1234567890' },
      },
      required: ['phoneNumber'],
    },
  })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  async testWhatsApp(
    @Body('phoneNumber') phoneNumber: string,
  ) {
    const result = await this.notificationService.sendNotification({
      userId: 'test',
      type: 'SYSTEM' as any,
      channel: 'WHATSAPP' as any,
      title: 'Test Message',
      message: 'This is a test message from DTMS. WhatsApp integration is working.',
      phone: phoneNumber,
    });

    return {
      success: true,
      notificationId: result,
      message: 'Test notification created. Check WhatsApp delivery status.',
    };
  }
}
