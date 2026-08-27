import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppProvider,
  WhatsAppTemplateMessage,
  WhatsAppSendResult,
} from './whatsapp.provider';

@Injectable()
export class WhatsAppCloudProvider implements WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppCloudProvider.name);
  private readonly enabled: boolean;
  private readonly apiVersion: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<string>('WHATSAPP_ENABLED', 'false') === 'true';
    this.apiVersion = this.config.get<string>('WHATSAPP_API_VERSION', 'v18.0');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.baseUrl = this.config.get<string>(
      'WHATSAPP_API_BASE_URL',
      'https://graph.facebook.com',
    );

    if (this.enabled && (!this.accessToken || !this.phoneNumberId)) {
      this.logger.warn(
        'WhatsApp is enabled but ACCESS_TOKEN or PHONE_NUMBER_ID is missing',
      );
    }

    this.logger.log(
      `WhatsApp Cloud Provider initialized: ${this.enabled ? 'ENABLED' : 'DISABLED'}`,
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendTemplateMessage(
    message: WhatsAppTemplateMessage,
  ): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      return { success: false, errorCode: 'DISABLED', errorMessage: 'WhatsApp is disabled' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: message.to,
      type: 'template',
      template: {
        name: message.templateName,
        language: { code: message.language },
        components: [
          {
            type: 'body',
            parameters: message.parameters.map((p) => ({
              type: p.type,
              ...(p.text && { text: p.text }),
              ...(p.currency && { currency: p.currency }),
              ...(p.date_time && { date_time: p.date_time }),
              ...(p.image && { image: p.image }),
            })),
          },
        ],
      },
    };

    return this.sendWithRetry(url, body);
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    if (!this.enabled) {
      return { success: false, errorCode: 'DISABLED', errorMessage: 'WhatsApp is disabled' };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };

    return this.sendWithRetry(url, body);
  }

  private async sendWithRetry(
    url: string,
    body: Record<string, any>,
    attempt = 1,
  ): Promise<WhatsAppSendResult> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as any;

      if (response.ok && data.messages?.[0]?.id) {
        return {
          success: true,
          providerMessageId: data.messages[0].id,
        };
      }

      const errorCode = data.error?.code?.toString() || 'UNKNOWN';
      const errorMessage = data.error?.message || 'Unknown error';
      const isRetryable = response.status >= 500 || response.status === 429;

      if (isRetryable && attempt < this.maxRetries) {
        this.logger.warn(
          `WhatsApp API retryable error (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`,
        );
        await this.delay(this.retryDelay * attempt);
        return this.sendWithRetry(url, body, attempt + 1);
      }

      this.logger.error(`WhatsApp API error: ${errorCode} - ${errorMessage}`);
      return { success: false, errorCode, errorMessage };
    } catch (error) {
      const isRetryable =
        error instanceof TypeError && error.message.includes('fetch');

      if (isRetryable && attempt < this.maxRetries) {
        this.logger.warn(
          `WhatsApp API network error (attempt ${attempt}/${this.maxRetries}): ${error.message}`,
        );
        await this.delay(this.retryDelay * attempt);
        return this.sendWithRetry(url, body, attempt + 1);
      }

      this.logger.error(`WhatsApp API network error: ${error.message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'Failed to connect to WhatsApp API',
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
