import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusDto {
  @ApiProperty({ description: 'Bus number', example: 101 })
  @IsNumber()
  @IsNotEmpty()
  busNumber: number;

  @ApiProperty({ description: 'Vehicle registration number', example: 'KA-01-AB-1234' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiPropertyOptional({ description: 'Total seating capacity', example: 40 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Boys seating capacity', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCapacity?: number;

  @ApiPropertyOptional({ description: 'Girls seating capacity', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCapacity?: number;

  @ApiPropertyOptional({ description: 'Assigned driver ID' })
  @IsString()
  @IsOptional()
  driverId?: string;
}

export class UpdateBusDto {
  @ApiPropertyOptional({ description: 'Bus number', example: 101 })
  @IsNumber()
  @IsOptional()
  busNumber?: number;

  @ApiPropertyOptional({ description: 'Vehicle registration number', example: 'KA-01-AB-1234' })
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Total seating capacity', example: 40 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Boys seating capacity', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCapacity?: number;

  @ApiPropertyOptional({ description: 'Girls seating capacity', example: 20 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCapacity?: number;
}

export class UpdateBusStatusDto {
  @ApiProperty({ description: 'Bus status', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  status: string;
}

export class AssignDriverDto {
  @ApiPropertyOptional({ description: 'Driver ID to assign' })
  @IsString()
  @IsOptional()
  driverId?: string;
}
