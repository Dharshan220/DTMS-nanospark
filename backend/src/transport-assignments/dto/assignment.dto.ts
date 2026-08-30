import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignStudentBusDto {
  @ApiProperty({ description: 'Bus ID to assign' })
  @IsString()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({ description: 'Bus stop ID for the student' })
  @IsString()
  @IsNotEmpty()
  busStopId: string;

  @ApiPropertyOptional({ description: 'Assignment start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Assignment end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateStudentAssignmentDto {
  @ApiPropertyOptional({ description: 'New bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'New bus stop ID' })
  @IsString()
  @IsOptional()
  busStopId?: string;

  @ApiPropertyOptional({ description: 'Updated end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AssignFacultyBusDto {
  @ApiProperty({ description: 'Bus ID to assign' })
  @IsString()
  @IsNotEmpty()
  busId: string;

  @ApiPropertyOptional({ description: 'Assignment start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Assignment end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateFacultyAssignmentDto {
  @ApiPropertyOptional({ description: 'New bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Updated end date (YYYY-MM-DD)', example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AssignBusRouteDto {
  @ApiPropertyOptional({ description: 'Route ID to assign to bus' })
  @IsString()
  @IsOptional()
  routeId?: string;
}
