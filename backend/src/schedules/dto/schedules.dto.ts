import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  Matches,
  IsDateString,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  busId: string;

  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['MORNING', 'EVENING'])
  tripType: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'departureTime must be HH:MM format (24h)' })
  departureTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'expectedArrivalTime must be HH:MM format (24h)' })
  expectedArrivalTime: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  busId?: string;

  @IsString()
  @IsOptional()
  routeId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'departureTime must be HH:MM format (24h)' })
  departureTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'expectedArrivalTime must be HH:MM format (24h)' })
  expectedArrivalTime?: string;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'CANCELLED'])
  status?: string;
}

export class CreateOverrideDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  replacementBusId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ScheduleFilterDto {
  @IsString()
  @IsOptional()
  busId?: string;

  @IsString()
  @IsOptional()
  routeId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'CANCELLED'])
  status?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
