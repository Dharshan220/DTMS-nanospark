import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';

export class AssignStudentBusDto {
  @IsString()
  @IsNotEmpty()
  busId: string;

  @IsString()
  @IsNotEmpty()
  busStopId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateStudentAssignmentDto {
  @IsString()
  @IsOptional()
  busId?: string;

  @IsString()
  @IsOptional()
  busStopId?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AssignFacultyBusDto {
  @IsString()
  @IsNotEmpty()
  busId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateFacultyAssignmentDto {
  @IsString()
  @IsOptional()
  busId?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AssignBusRouteDto {
  @IsString()
  @IsOptional()
  routeId?: string;
}
