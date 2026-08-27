import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppProvider,
  WhatsAppTemplateMessage,
  WhatsAppSendResult,
} from './whatsapp.provider';
import { WhatsAppCloudProvider } from './whatsapp-cloud.provider';

export interface NotificationSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);
  private readonly whatsapp: WhatsAppProvider;

  constructor(private readonly config: ConfigService) {
    this.whatsapp = new WhatsAppCloudProvider(config);
  }

  isWhatsAppEnabled(): boolean {
    return this.whatsapp.isEnabled();
  }

  async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    parameters: { type: string; text?: string }[],
  ): Promise<NotificationSendResult> {
    if (!this.whatsapp.isEnabled()) {
      return {
        success: false,
        provider: 'whatsapp',
        errorCode: 'DISABLED',
        errorMessage: 'WhatsApp is disabled',
      };
    }

    const language = this.config.get<string>('WHATSAPP_TEMPLATE_LANGUAGE', 'en');

    const result = await this.whatsapp.sendTemplateMessage({
      to,
      templateName,
      language,
      parameters: parameters.map((p) => ({
        type: p.type as 'text',
        text: p.text,
      })),
    });

    return {
      success: result.success,
      provider: 'whatsapp',
      providerMessageId: result.providerMessageId,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    };
  }

  async sendWhatsAppText(
    to: string,
    text: string,
  ): Promise<NotificationSendResult> {
    if (!this.whatsapp.isEnabled()) {
      return {
        success: false,
        provider: 'whatsapp',
        errorCode: 'DISABLED',
        errorMessage: 'WhatsApp is disabled',
      };
    }

    const result = await this.whatsapp.sendTextMessage(to, text);

    return {
      success: result.success,
      provider: 'whatsapp',
      providerMessageId: result.providerMessageId,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    };
  }
}
