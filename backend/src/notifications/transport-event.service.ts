import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from './notification.service';
import {
  NotificationChannel,
  NotificationType,
  TransportEventType,
} from '@prisma/client';

export interface TransportEventPayload {
  oldBusId?: string;
  newBusId?: string;
  oldBusNumber?: string;
  newBusNumber?: string;
  routeId?: string;
  routeCode?: string;
  routeName?: string;
  oldRouteCode?: string;
  oldRouteName?: string;
  busStopId?: string;
  busStopName?: string;
  oldBusStopName?: string;
  effectiveDate?: string;
  announcementTitle?: string;
  announcementMessage?: string;
  target?: string;
  targetId?: string;
}

@Injectable()
export class TransportEventService {
  private readonly logger = new Logger(TransportEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Create Event + Send Notifications ─────────────────────

  async createTransportEvent(params: {
    eventType: TransportEventType;
    entityType: string;
    entityId: string;
    createdBy?: string;
    payload: TransportEventPayload;
    idempotencyKey?: string;
  }): Promise<string | null> {
    // Idempotency check
    if (params.idempotencyKey) {
      const existing = await this.prisma.transportNotificationEvent.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) {
        this.logger.warn(`Duplicate event blocked: ${params.idempotencyKey}`);
        return null;
      }
    }

    const event = await this.prisma.transportNotificationEvent.create({
      data: {
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        createdBy: params.createdBy || null,
        payload: params.payload as any,
        idempotencyKey: params.idempotencyKey || null,
      },
    });

    this.logger.log(`Transport event created: ${params.eventType} for ${params.entityType} ${params.entityId}`);

    // Process notifications asynchronously
    this.processEventNotifications(event.id, params.eventType, params.payload).catch(
      (err) => {
        this.logger.error(`Failed to process event notifications: ${err.message}`);
      },
    );

    return event.id;
  }

  private async processEventNotifications(
    eventId: string,
    eventType: TransportEventType,
    payload: TransportEventPayload,
  ): Promise<void> {
    switch (eventType) {
      case TransportEventType.BUS_ASSIGNED:
        await this.handleBusAssigned(payload);
        break;
      case TransportEventType.BUS_SWAPPED:
        await this.handleBusSwapped(payload);
        break;
      case TransportEventType.BUS_REPLACED:
        await this.handleBusReplaced(payload);
        break;
      case TransportEventType.BUS_CANCELLED:
        await this.handleBusCancelled(payload);
        break;
      case TransportEventType.ROUTE_CHANGED:
        await this.handleRouteChanged(payload);
        break;
      case TransportEventType.BUS_STOP_CHANGED:
        await this.handleBusStopChanged(payload);
        break;
      case TransportEventType.TRANSPORT_ANNOUNCEMENT:
        await this.handleAnnouncement(payload);
        break;
    }
  }

  // ─── Bus Assigned ──────────────────────────────────────────

  private async handleBusAssigned(payload: TransportEventPayload) {
    if (!payload.newBusId) return;

    const users = await this.findUsersByBusId(payload.newBusId);
    if (users.length === 0) return;

    const userIds = users.map((u) => u.userId);
    const bus = await this.prisma.bus.findUnique({
      where: { id: payload.newBusId },
      include: { route: { select: { routeCode: true, routeName: true } } },
    });

    const routeInfo = bus?.route
      ? `Route: ${bus.route.routeCode} (${bus.route.routeName})`
      : '';

    const busStopInfo = payload.busStopName
      ? `Bus Stop: ${payload.busStopName}`
      : '';

    const message = `DTMS Transport Update\n\nYou have been assigned to Bus BUS-${bus?.busNumber || ''}.\n${routeInfo}\n${busStopInfo}\n\nPlease use the assigned bus according to the updated schedule.`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Bus Assigned',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_BUS_ASSIGNED || 'bus_assigned',
      templateParams: [
        { type: 'text', text: `Bus BUS-${bus?.busNumber || ''}` },
        { type: 'text', text: bus?.route?.routeCode || '' },
        { type: 'text', text: payload.busStopName || '' },
      ],
      target: 'SPECIFIC_BUS',
      targetId: payload.newBusId,
      eventType: TransportEventType.BUS_ASSIGNED,
      entityId: payload.newBusId,
    });
  }

  // ─── Bus Swapped ───────────────────────────────────────────

  private async handleBusSwapped(payload: TransportEventPayload) {
    if (!payload.newBusId) return;

    const users = await this.findUsersByBusId(payload.newBusId);
    if (users.length === 0) return;

    const userIds = users.map((u) => u.userId);

    const newBus = await this.prisma.bus.findUnique({
      where: { id: payload.newBusId },
      include: { route: { select: { routeCode: true, routeName: true } } },
    });

    const message = `DTMS Bus Update\n\nYour bus has been changed.\nPrevious Bus: BUS-${payload.oldBusNumber || ''}\nNew Bus: BUS-${newBus?.busNumber || ''}\nRoute: ${newBus?.route?.routeCode || ''}\n\nPlease use the new bus.`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Bus Changed',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_BUS_SWAPPED || 'bus_swapped',
      templateParams: [
        { type: 'text', text: `BUS-${payload.oldBusNumber || ''}` },
        { type: 'text', text: `BUS-${newBus?.busNumber || ''}` },
        { type: 'text', text: newBus?.route?.routeCode || '' },
      ],
      target: 'SPECIFIC_BUS',
      targetId: payload.newBusId,
      eventType: TransportEventType.BUS_SWAPPED,
      entityId: payload.newBusId,
    });
  }

  // ─── Bus Replaced ──────────────────────────────────────────

  private async handleBusReplaced(payload: TransportEventPayload) {
    if (!payload.oldBusId) return;

    const users = await this.findUsersByBusId(payload.oldBusId);
    if (users.length === 0) return;

    const userIds = users.map((u) => u.userId);

    const replacementBus = payload.newBusId
      ? await this.prisma.bus.findUnique({
          where: { id: payload.newBusId },
          select: { busNumber: true },
        })
      : null;

    const message = `DTMS Transport Update\n\nBus BUS-${payload.oldBusNumber || ''} has been temporarily replaced.\nReplacement Bus: BUS-${replacementBus?.busNumber || ''}\n\nPlease use BUS-${replacementBus?.busNumber || ''} for your journey.`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Bus Replaced',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_BUS_REPLACED || 'bus_replaced',
      templateParams: [
        { type: 'text', text: `BUS-${payload.oldBusNumber || ''}` },
        { type: 'text', text: `BUS-${replacementBus?.busNumber || ''}` },
      ],
      target: 'SPECIFIC_BUS',
      targetId: payload.oldBusId,
      eventType: TransportEventType.BUS_REPLACED,
      entityId: payload.oldBusId,
    });
  }

  // ─── Bus Cancelled ─────────────────────────────────────────

  private async handleBusCancelled(payload: TransportEventPayload) {
    if (!payload.oldBusId) return;

    const users = await this.findUsersByBusId(payload.oldBusId);
    if (users.length === 0) return;

    const userIds = users.map((u) => u.userId);

    const message = `DTMS Transport Alert\n\nBus BUS-${payload.oldBusNumber || ''} has been cancelled.\n\nPlease check the DTMS system for further transport instructions.`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Bus Cancelled',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_BUS_CANCELLED || 'bus_cancelled',
      templateParams: [
        { type: 'text', text: `BUS-${payload.oldBusNumber || ''}` },
      ],
      target: 'SPECIFIC_BUS',
      targetId: payload.oldBusId,
      eventType: TransportEventType.BUS_CANCELLED,
      entityId: payload.oldBusId,
    });
  }

  // ─── Route Changed ─────────────────────────────────────────

  private async handleRouteChanged(payload: TransportEventPayload) {
    if (!payload.routeId) return;

    const users = await this.findUsersByRouteId(payload.routeId);
    if (users.length === 0) return;

    const userIds = users.map((u) => u.userId);

    const message = `DTMS Route Update\n\nYour transport route has been updated.\nRoute: ${payload.routeCode || ''} ${payload.routeName || ''}\n\nPlease check the DTMS system for the latest route information.`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Route Changed',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_ROUTE_CHANGED || 'route_changed',
      templateParams: [
        { type: 'text', text: payload.routeCode || '' },
      ],
      target: 'SPECIFIC_ROUTE',
      targetId: payload.routeId,
      eventType: TransportEventType.ROUTE_CHANGED,
      entityId: payload.routeId,
    });
  }

  // ─── Bus Stop Changed ──────────────────────────────────────

  private async handleBusStopChanged(payload: TransportEventPayload) {
    if (!payload.busStopId) return;

    const assignments = await this.prisma.studentBusAssignment.findMany({
      where: { busStopId: payload.busStopId, status: 'ACTIVE' },
      select: { studentId: true },
    });

    const studentUsers = await this.prisma.student.findMany({
      where: { id: { in: assignments.map((a) => a.studentId) } },
      select: { userId: true },
    });

    const userIds = studentUsers.map((s) => s.userId);
    if (userIds.length === 0) return;

    const message = `DTMS Bus Stop Update\n\nYour bus stop has been changed.\nPrevious Stop: ${payload.oldBusStopName || ''}\nNew Stop: ${payload.busStopName || ''}`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: 'Bus Stop Changed',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_BUS_STOP_CHANGED || 'bus_stop_changed',
      templateParams: [
        { type: 'text', text: payload.oldBusStopName || '' },
        { type: 'text', text: payload.busStopName || '' },
      ],
      target: 'SPECIFIC_STUDENTS',
      targetId: payload.busStopId,
      eventType: TransportEventType.BUS_STOP_CHANGED,
      entityId: payload.busStopId,
    });
  }

  // ─── Announcement ──────────────────────────────────────────

  private async handleAnnouncement(payload: TransportEventPayload) {
    let userIds: string[] = [];

    if (payload.target === 'ALL_USERS') {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (payload.target === 'ALL_STUDENTS') {
      const students = await this.prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true },
      });
      userIds = students.map((s) => s.userId);
    } else if (payload.target === 'ALL_FACULTY') {
      const faculty = await this.prisma.faculty.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true },
      });
      userIds = faculty.map((f) => f.userId);
    } else if (payload.target === 'SPECIFIC_BUS' && payload.targetId) {
      const users = await this.findUsersByBusId(payload.targetId);
      userIds = users.map((u) => u.userId);
    } else if (payload.target === 'SPECIFIC_ROUTE' && payload.targetId) {
      const users = await this.findUsersByRouteId(payload.targetId);
      userIds = users.map((u) => u.userId);
    }

    if (userIds.length === 0) return;

    const message = `DTMS Transport Announcement\n\n${payload.announcementMessage || ''}`;

    await this.notificationService.sendBulkNotifications({
      userIds,
      type: NotificationType.TRANSPORT,
      channel: NotificationChannel.WHATSAPP,
      title: payload.announcementTitle || 'Transport Announcement',
      message,
      templateName: process.env.WHATSAPP_TEMPLATE_TRANSPORT_ANNOUNCEMENT || 'transport_announcement',
      templateParams: [
        { type: 'text', text: payload.announcementMessage || '' },
      ],
      target: payload.target || 'ALL_USERS',
      targetId: payload.targetId,
      eventType: TransportEventType.TRANSPORT_ANNOUNCEMENT,
      entityId: payload.targetId || '',
    });
  }

  // ─── User Discovery Helpers ────────────────────────────────

  private async findUsersByBusId(busId: string): Promise<{ userId: string }[]> {
    const studentAssignments = await this.prisma.studentBusAssignment.findMany({
      where: { busId, status: 'ACTIVE' },
      select: { student: { select: { userId: true } } },
    });

    const facultyAssignments = await this.prisma.facultyBusAssignment.findMany({
      where: { busId, status: 'ACTIVE' },
      select: { faculty: { select: { userId: true } } },
    });

    const users = [
      ...studentAssignments.map((a) => ({ userId: a.student.userId })),
      ...facultyAssignments.map((a) => ({ userId: a.faculty.userId })),
    ];

    return users;
  }

  private async findUsersByRouteId(routeId: string): Promise<{ userId: string }[]> {
    const buses = await this.prisma.bus.findMany({
      where: { routeId, status: 'ACTIVE' },
      select: { id: true },
    });

    const busIds = buses.map((b) => b.id);

    if (busIds.length === 0) return [];

    const studentAssignments = await this.prisma.studentBusAssignment.findMany({
      where: { busId: { in: busIds }, status: 'ACTIVE' },
      select: { student: { select: { userId: true } } },
    });

    const facultyAssignments = await this.prisma.facultyBusAssignment.findMany({
      where: { busId: { in: busIds }, status: 'ACTIVE' },
      select: { faculty: { select: { userId: true } } },
    });

    const users = [
      ...studentAssignments.map((a) => ({ userId: a.student.userId })),
      ...facultyAssignments.map((a) => ({ userId: a.faculty.userId })),
    ];

    return users;
  }

  // ─── Emergency Notification ────────────────────────────────

  async notifyEmergencyAlert(params: {
    adminPhone: string;
    emergencyType: string;
    userName: string;
    busNumber?: string;
    message?: string;
  }): Promise<void> {
    const notifMessage = `🚨 DTMS EMERGENCY SOS\n\nType: ${params.emergencyType}\nFrom: ${params.userName}\n${params.busNumber ? `Bus: BUS-${params.busNumber}` : ''}\n${params.message ? `Message: ${params.message}` : ''}\n\nImmediate attention required.`;

    const adminUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (adminUser) {
      await this.notificationService.sendNotification({
        userId: adminUser.id,
        type: NotificationType.EMERGENCY,
        channel: NotificationChannel.WHATSAPP,
        title: 'Emergency SOS Alert',
        message: notifMessage,
        phone: params.adminPhone,
      });
    }
  }

  // ─── Complaint Notification ────────────────────────────────

  async notifyComplaintStatusChange(params: {
    studentUserId: string;
    complaintId: string;
    subject: string;
    oldStatus: string;
    newStatus: string;
    resolutionNote?: string;
  }): Promise<void> {
    let message = '';

    if (params.newStatus === 'IN_REVIEW') {
      message = `DTMS Complaint Update\n\nYour complaint "${params.subject}" is now being reviewed.\nStatus: ${params.newStatus}`;
    } else if (params.newStatus === 'RESOLVED') {
      message = `DTMS Complaint Resolved\n\nYour complaint "${params.subject}" has been resolved.\n${params.resolutionNote ? `Note: ${params.resolutionNote}` : ''}`;
    } else if (params.newStatus === 'REJECTED') {
      message = `DTMS Complaint Update\n\nYour complaint "${params.subject}" has been reviewed and rejected.`;
    } else {
      return;
    }

    await this.notificationService.sendNotification({
      userId: params.studentUserId,
      type: NotificationType.COMPLAINT,
      channel: NotificationChannel.WHATSAPP,
      title: `Complaint ${params.newStatus}`,
      message,
    });
  }

  // ─── Feedback Notification ─────────────────────────────────

  async notifyFeedbackStatusChange(params: {
    studentUserId: string;
    feedbackId: string;
    subject: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    let message = '';

    if (params.newStatus === 'REVIEWED') {
      message = `DTMS Feedback Update\n\nYour feedback "${params.subject}" has been reviewed.\nThank you for your feedback!`;
    } else if (params.newStatus === 'RESOLVED') {
      message = `DTMS Feedback Resolved\n\nYour feedback "${params.subject}" has been processed.`;
    } else {
      return;
    }

    await this.notificationService.sendNotification({
      userId: params.studentUserId,
      type: NotificationType.FEEDBACK,
      channel: NotificationChannel.WHATSAPP,
      title: `Feedback ${params.newStatus}`,
      message,
    });
  }
}
