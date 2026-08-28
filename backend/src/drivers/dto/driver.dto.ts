import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  driverCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateDriverDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateDriverStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status: string;
}
