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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ description: 'Unique driver code', example: 'DRV001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  driverCode: string;

  @ApiProperty({ description: 'Driver full name', example: 'Ravi Kumar' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Primary phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Alternate phone number', example: '9876543211' })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiProperty({ description: 'Driving license number', example: 'DL-1234567890' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'License expiry date (ISO 8601)', example: '2027-12-31' })
  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @ApiPropertyOptional({ description: 'Years of driving experience', example: 5, minimum: 0, maximum: 50 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ApiPropertyOptional({ description: 'Residential address' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ description: 'Driver full name', example: 'Ravi Kumar' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Primary phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Alternate phone number', example: '9876543211' })
  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @ApiPropertyOptional({ description: 'Driving license number', example: 'DL-1234567890' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'License expiry date (ISO 8601)', example: '2027-12-31' })
  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @ApiPropertyOptional({ description: 'Years of driving experience', example: 5, minimum: 0, maximum: 50 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ApiPropertyOptional({ description: 'Residential address' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateDriverStatusDto {
  @ApiProperty({ description: 'Driver status', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status: string;
}
