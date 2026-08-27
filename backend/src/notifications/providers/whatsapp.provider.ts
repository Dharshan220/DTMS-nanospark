export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
  image?: { link: string };
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  language: string;
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface WhatsAppProvider {
  sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppSendResult>;
  sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult>;
  isEnabled(): boolean;
}
