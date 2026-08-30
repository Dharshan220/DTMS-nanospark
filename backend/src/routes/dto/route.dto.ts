import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @ApiProperty({ description: 'Unique route code', example: 'RTE001' })
  @IsString()
  @IsNotEmpty()
  routeCode: string;

  @ApiProperty({ description: 'Route display name', example: 'Route A - City Center' })
  @IsString()
  @IsNotEmpty()
  routeName: string;

  @ApiPropertyOptional({ description: 'Route description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRouteDto {
  @ApiPropertyOptional({ description: 'Route display name', example: 'Route A - City Center' })
  @IsString()
  @IsOptional()
  routeName?: string;

  @ApiPropertyOptional({ description: 'Route description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRouteStatusDto {
  @ApiProperty({ description: 'Route status', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
