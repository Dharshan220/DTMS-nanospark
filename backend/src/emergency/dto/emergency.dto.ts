import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmergencyDto {
  @ApiPropertyOptional({ description: 'Emergency type', enum: ['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'] })
  @IsString()
  @IsOptional()
  @IsIn(['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'])
  type?: string;

  @ApiPropertyOptional({ description: 'Emergency message', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ description: 'GPS latitude (-90 to 90)', minimum: -90, maximum: 90 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude (-180 to 180)', minimum: -180, maximum: 180 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Location accuracy in meters', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  locationAccuracy?: number;
}

export class AcknowledgeEmergencyDto {
  @ApiPropertyOptional({ description: 'Acknowledgement note', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class ResolveEmergencyDto {
  @ApiPropertyOptional({ description: 'Resolution note', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  resolutionNote?: string;
}

export class EmergencyFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: ['CRITICAL', 'HIGH', 'MEDIUM'] })
  @IsString()
  @IsOptional()
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'] })
  @IsString()
  @IsOptional()
  @IsIn(['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
