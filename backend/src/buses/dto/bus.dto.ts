import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';

export class CreateBusDto {
  @IsNumber()
  @IsNotEmpty()
  busNumber: number;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCapacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCapacity?: number;

  @IsString()
  @IsOptional()
  driverId?: string;
}

export class UpdateBusDto {
  @IsNumber()
  @IsOptional()
  busNumber?: number;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCapacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCapacity?: number;
}

export class UpdateBusStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  status: string;
}

export class AssignDriverDto {
  @IsString()
  @IsOptional()
  driverId?: string;
}
