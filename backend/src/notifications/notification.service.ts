import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationProviderService } from './providers/notification.provider';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: NotificationProviderService,
  ) {}

  // ─── Send Notification ─────────────────────────────────────

  async sendNotification(params: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    phone?: string;
    templateName?: string;
    templateParams?: { type: string; text?: string }[];
  }): Promise<string> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel: params.channel,
        title: params.title,
        message: params.message,
        status: NotificationStatus.PENDING,
      },
    });

    this.processNotification(notification.id, params).catch((err) => {
      this.logger.error(`Failed to process notification ${notification.id}: ${err.message}`);
    });

    return notification.id;
  }

  private async processNotification(
    notificationId: string,
    params: {
      phone?: string;
      channel: NotificationChannel;
      templateName?: string;
      templateParams?: { type: string; text?: string }[];
      message: string;
    },
  ): Promise<void> {
    if (params.channel === NotificationChannel.WHATSAPP) {
      if (!params.phone) {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          'PHONE_MISSING',
          'Recipient phone number unavailable',
        );
        return;
      }

      if (!this.provider.isWhatsAppEnabled()) {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.SENT,
          undefined,
          undefined,
          'skipped_disabled',
        );
        return;
      }

      let result;
      if (params.templateName && params.templateParams) {
        result = await this.provider.sendWhatsAppTemplate(
          params.phone,
          params.templateName,
          params.templateParams,
        );
      } else {
        result = await this.provider.sendWhatsAppText(
          params.phone,
          params.message,
        );
      }

      if (result.success) {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.SENT,
          undefined,
          undefined,
          undefined,
          result.providerMessageId,
        );
      } else {
        await this.updateNotificationStatus(
          notificationId,
          NotificationStatus.FAILED,
          result.errorCode,
          result.errorMessage,
        );
      }
    } else {
      await this.updateNotificationStatus(
        notificationId,
        NotificationStatus.SENT,
      );
    }
  }

  private async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    errorCode?: string,
    errorMessage?: string,
    provider?: string,
    providerMessageId?: string,
  ): Promise<void> {
    const updateData: Prisma.NotificationUpdateInput = {
      status,
      ...(status === NotificationStatus.SENT && { sentAt: new Date() }),
      ...(status === NotificationStatus.DELIVERED && { deliveredAt: new Date() }),
      ...(status === NotificationStatus.READ && { readAt: new Date() }),
      ...(errorCode && { errorCode }),
      ...(errorMessage && { errorMessage }),
      ...(provider && { provider }),
      ...(providerMessageId && { providerMessageId }),
    };

    await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── Bulk Send ─────────────────────────────────────────────

  async sendBulkNotifications(params: {
    userIds: string[];
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
    templateName?: string;
    templateParams?: { type: string; text?: string }[];
    target: string;
    targetId?: string;
    eventType?: string;
    entityId?: string;
  }): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const userId of params.userIds) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          student: { select: { id: true, phone: true } },
          faculty: { select: { id: true, phone: true } },
        },
      });

      if (!user) {
        skipped++;
        continue;
      }

      const phone = user.student?.phone || user.faculty?.phone;

      if (!phone) {
        await this.sendNotification({
          userId,
          type: params.type,
          channel: NotificationChannel.IN_APP,
          title: params.title,
          message: params.message,
        });
        skipped++;
        continue;
      }

      await this.sendNotification({
        userId,
        type: params.type,
        channel: params.channel,
        title: params.title,
        message: params.message,
        phone,
        templateName: params.templateName,
        templateParams: params.templateParams,
      });
      created++;
    }

    this.logger.log(
      `Bulk notification sent: ${created} created, ${skipped} skipped for ${params.eventType || 'manual'}`,
    );

    return { created, skipped };
  }

  // ─── User: View Own Notifications ──────────────────────────

  async getUserNotifications(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    if (query.status) where.status = query.status as NotificationStatus;
    if (query.type) where.type = query.type as NotificationType;

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatNotificationResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return null;
    if (notification.userId !== userId) return null;

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    return this.formatNotificationResponse(updated);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        status: { notIn: [NotificationStatus.READ] },
      },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  // ─── Admin: View All Notifications ─────────────────────────

  async getAdminNotifications(query: {
    page?: number;
    limit?: number;
    channel?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (query.channel) where.channel = query.channel as NotificationChannel;
    if (query.type) where.type = query.type as NotificationType;
    if (query.status) where.status = query.status as NotificationStatus;

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
        { user: { student: { name: { contains: query.search, mode: 'insensitive' } } } },
        { user: { student: { registerNumber: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              student: { select: { id: true, name: true, registerNumber: true } },
              faculty: { select: { id: true, name: true, facultyId: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: records.map((r) => this.formatAdminNotificationResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Webhook Status Update ─────────────────────────────────

  async updateDeliveryStatus(
    providerMessageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
  ): Promise<boolean> {
    const notification = await this.prisma.notification.findFirst({
      where: { providerMessageId },
    });

    if (!notification) return false;

    const statusMap: Record<string, NotificationStatus> = {
      sent: NotificationStatus.SENT,
      delivered: NotificationStatus.DELIVERED,
      read: NotificationStatus.READ,
      failed: NotificationStatus.FAILED,
    };

    const newStatus = statusMap[status] || NotificationStatus.FAILED;

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: newStatus,
        ...(newStatus === NotificationStatus.SENT && { sentAt: new Date() }),
        ...(newStatus === NotificationStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(newStatus === NotificationStatus.READ && { readAt: new Date() }),
      },
    });

    return true;
  }

  // ─── Formatting ────────────────────────────────────────────

  private formatNotificationResponse(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  private formatAdminNotificationResponse(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      channel: notification.channel,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      provider: notification.provider,
      providerMessageId: notification.providerMessageId,
      errorCode: notification.errorCode,
      errorMessage: notification.errorMessage,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      user: notification.user,
    };
  }
}
