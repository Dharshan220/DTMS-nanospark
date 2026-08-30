import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddStopToRouteDto {
  @ApiProperty({ description: 'Bus stop ID to add to the route' })
  @IsString()
  @IsNotEmpty()
  busStopId: string;

  @ApiProperty({ description: 'Stop order position in the route', example: 1 })
  @IsNumber()
  @Min(1)
  stopOrder: number;

  @ApiPropertyOptional({ description: 'Estimated arrival time (ISO 8601)', example: '2026-01-01T08:30:00.000Z' })
  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string;
}

export class UpdateRouteStopDto {
  @ApiPropertyOptional({ description: 'Stop order position in the route', example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  stopOrder?: number;

  @ApiPropertyOptional({ description: 'Estimated arrival time (ISO 8601)', example: '2026-01-01T08:45:00.000Z' })
  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string;
}

export class ReorderStopsDto {
  @ApiProperty({ description: 'Ordered list of route stop IDs', type: [String] })
  @IsString({ each: true })
  @IsNotEmpty()
  routeStopIds: string[];
}
