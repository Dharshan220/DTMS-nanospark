import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class AddStopToRouteDto {
  @IsString()
  @IsNotEmpty()
  busStopId: string;

  @IsNumber()
  @Min(1)
  stopOrder: number;

  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string;
}

export class UpdateRouteStopDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  stopOrder?: number;

  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string;
}

export class ReorderStopsDto {
  @IsString({ each: true })
  @IsNotEmpty()
  routeStopIds: string[];
}
