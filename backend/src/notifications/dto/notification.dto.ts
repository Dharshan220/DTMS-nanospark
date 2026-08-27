import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsIn(['WHATSAPP', 'IN_APP'])
  channel: string;

  @IsString()
  @IsIn(['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'])
  type: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsOptional()
  recipientUserId?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;
}

export class NotificationFilterDto {
  @IsString()
  @IsOptional()
  @IsIn(['WHATSAPP', 'IN_APP'])
  channel?: string;

  @IsString()
  @IsOptional()
  @IsIn(['EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM'])
  type?: string;

  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'])
  status?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class TestWhatsAppDto {
  @IsString()
  phoneNumber: string;
}

export class CreateAnnouncementDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsString()
  @IsIn(['ALL_STUDENTS', 'ALL_FACULTY', 'ALL_USERS', 'SPECIFIC_BUS', 'SPECIFIC_ROUTE'])
  target: string;

  @IsString()
  @IsOptional()
  targetId?: string;
}
