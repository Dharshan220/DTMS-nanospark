import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly verifyToken: string;
  private readonly appSecret: string | undefined;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly config: ConfigService,
  ) {
    const token = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (!token) {
      this.logger.warn(
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set — WhatsApp webhook verification will fail',
      );
    }
    this.verifyToken = token || '';

    this.appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
  }

  @Get('whatsapp')
  @ApiOperation({ summary: 'Verify WhatsApp webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook verified successfully' })
  verifyWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (!this.verifyToken) {
      this.logger.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured');
      res.sendStatus(503);
      return;
    }

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      this.logger.warn('WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  }

  @Post('whatsapp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle incoming WhatsApp webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      if (this.appSecret) {
        const signature = req.headers['x-hub-signature-256'] as string;
        if (!signature) {
          this.logger.warn('Webhook request missing X-Hub-Signature-256');
          res.sendStatus(403);
          return;
        }

        const body = JSON.stringify(req.body);
        const expectedSignature =
          'sha256=' +
          crypto.createHmac('sha256', this.appSecret).update(body).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
          this.logger.warn('Webhook signature verification failed');
          res.sendStatus(403);
          return;
        }
      }

      const body = req.body;

      if (body.object !== 'whatsapp_business_account') {
        res.sendStatus(404);
        return;
      }

      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;

          // Process status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.processStatusUpdate(status);
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      res.sendStatus(200);
    }
  }

  private async processStatusUpdate(status: any) {
    const providerMessageId = status.id;
    const statusType = status.status;

    if (!providerMessageId || !statusType) return;

    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    if (!validStatuses.includes(statusType)) return;

    const updated = await this.notificationService.updateDeliveryStatus(
      providerMessageId,
      statusType as 'sent' | 'delivered' | 'read' | 'failed',
    );

    if (updated) {
      this.logger.log(`Notification status updated: ${providerMessageId} -> ${statusType}`);
    }
  }
}
