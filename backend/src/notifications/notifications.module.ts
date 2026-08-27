import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { TransportEventService } from './transport-event.service';
import { NotificationController } from './notification.controller';
import { WebhookController } from './webhook.controller';
import { NotificationProviderService } from './providers/notification.provider';

@Module({
  controllers: [NotificationController, WebhookController],
  providers: [
    NotificationService,
    TransportEventService,
    NotificationProviderService,
  ],
  exports: [NotificationService, TransportEventService, NotificationProviderService],
})
export class NotificationsModule {}
