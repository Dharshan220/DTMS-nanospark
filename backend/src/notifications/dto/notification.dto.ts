import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ description: 'Notification channel', enum: ['WHATSAPP', 'IN_APP'] })
  @IsString()
  @IsIn(['WHATSAPP', 'IN_APP'])
  channel: string;

  @ApiProperty({ description: 'Notification type', enum: ['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'] })
  @IsString()
  @IsIn(['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'])
  type: string;

  @ApiProperty({ description: 'Notification title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Notification message', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Recipient user ID' })
  @IsString()
  @IsOptional()
  recipientUserId?: string;

  @ApiPropertyOptional({ description: 'Recipient phone number' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;
}

export class NotificationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by channel', enum: ['WHATSAPP', 'IN_APP'] })
  @IsString()
  @IsOptional()
  @IsIn(['WHATSAPP', 'IN_APP'])
  channel?: string;

  @ApiPropertyOptional({ description: 'Filter by notification type', enum: ['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'] })
  @IsString()
  @IsOptional()
  @IsIn(['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by delivery status', enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] })
  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class TestWhatsAppDto {
  @ApiProperty({ description: 'Phone number to send test message', example: '+919876543210' })
  @IsString()
  phoneNumber: string;
}

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title', maxLength: 500, example: 'Route Change Notice' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({ description: 'Announcement message', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({ description: 'Target audience', enum: ['ALL_STUDENTS', 'ALL_FACULTY', 'ALL_USERS', 'SPECIFIC_BUS', 'SPECIFIC_ROUTE'] })
  @IsString()
  @IsIn(['ALL_STUDENTS', 'ALL_FACULTY', 'ALL_USERS', 'SPECIFIC_BUS', 'SPECIFIC_ROUTE'])
  target: string;

  @ApiPropertyOptional({ description: 'Target ID (bus or route) for SPECIFIC targets' })
  @IsString()
  @IsOptional()
  targetId?: string;
}
