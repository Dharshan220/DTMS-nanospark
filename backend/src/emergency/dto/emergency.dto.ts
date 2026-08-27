import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateEmergencyDto {
  @IsString()
  @IsOptional()
  @IsIn(['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'])
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  locationAccuracy?: number;
}

export class AcknowledgeEmergencyDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class ResolveEmergencyDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  resolutionNote?: string;
}

export class EmergencyFilterDto {
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['CRITICAL', 'HIGH', 'MEDIUM'])
  priority?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER'])
  type?: string;

  @IsString()
  @IsOptional()
  busId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
