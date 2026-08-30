import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Bus ID for the schedule' })
  @IsString()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({ description: 'Route ID for the schedule' })
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({ description: 'Trip type', enum: ['MORNING', 'EVENING'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['MORNING', 'EVENING'])
  tripType: string;

  @ApiProperty({ description: 'Departure time (HH:MM 24h format)', example: '08:30' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'departureTime must be HH:MM format (24h)' })
  departureTime: string;

  @ApiProperty({ description: 'Expected arrival time (HH:MM 24h format)', example: '09:30' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'expectedArrivalTime must be HH:MM format (24h)' })
  expectedArrivalTime: string;

  @ApiProperty({ description: 'Schedule effective start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @ApiPropertyOptional({ description: 'Schedule effective end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Updated bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Updated route ID' })
  @IsString()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ description: 'Updated trip type', enum: ['MORNING', 'EVENING'] })
  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @ApiPropertyOptional({ description: 'Updated departure time (HH:MM)', example: '09:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'departureTime must be HH:MM format (24h)' })
  departureTime?: string;

  @ApiPropertyOptional({ description: 'Updated expected arrival time (HH:MM)', example: '10:00' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'expectedArrivalTime must be HH:MM format (24h)' })
  expectedArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Updated effective start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Updated effective end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Update schedule status', enum: ['ACTIVE', 'INACTIVE', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'CANCELLED'])
  status?: string;
}

export class CreateOverrideDto {
  @ApiProperty({ description: 'Override date (YYYY-MM-DD)', example: '2026-08-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Replacement bus ID' })
  @IsString()
  @IsOptional()
  replacementBusId?: string;

  @ApiPropertyOptional({ description: 'Reason for the override' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ScheduleFilterDto {
  @ApiPropertyOptional({ description: 'Filter by bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Filter by route ID' })
  @IsString()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ description: 'Filter by trip type', enum: ['MORNING', 'EVENING'] })
  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ['ACTIVE', 'INACTIVE', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  limit?: number;
}
