import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusStopDto {
  @ApiProperty({ description: 'Unique stop code', example: 'STP001' })
  @IsString()
  @IsNotEmpty()
  stopCode: string;

  @ApiProperty({ description: 'Stop name', example: 'Central Bus Stand' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Stop address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Geographic latitude', example: 12.9716 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Geographic longitude', example: 77.5946 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdateBusStopDto {
  @ApiPropertyOptional({ description: 'Stop name', example: 'Central Bus Stand' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Stop address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Geographic latitude', example: 12.9716 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Geographic longitude', example: 77.5946 })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdateBusStopStatusDto {
  @ApiProperty({ description: 'Bus stop status', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
