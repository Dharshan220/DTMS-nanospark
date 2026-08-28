import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  routeCode: string;

  @IsString()
  @IsNotEmpty()
  routeName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  routeName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRouteStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
