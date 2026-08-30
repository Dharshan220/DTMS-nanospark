import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ description: 'Complaint subject', minLength: 3, maxLength: 200, example: 'Bus late today' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Detailed complaint description', minLength: 10, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: 'Complaint category', enum: ['BUS', 'DRIVER', 'ROUTE', 'BUS_STOP', 'ATTENDANCE', 'SAFETY', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUS', 'DRIVER', 'ROUTE', 'BUS_STOP', 'ATTENDANCE', 'SAFETY', 'OTHER'])
  category: string;

  @ApiPropertyOptional({ description: 'Complaint priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' })
  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Related bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Related driver ID' })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Related route ID' })
  @IsString()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ description: 'Related bus stop ID' })
  @IsString()
  @IsOptional()
  busStopId?: string;
}

export class UpdateComplaintDto {
  @ApiPropertyOptional({ description: 'Update complaint status', enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'] })
  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Update complaint priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Resolution note', minLength: 5, maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(1000)
  resolutionNote?: string;
}

export class ComplaintFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'] })
  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ['BUS', 'DRIVER', 'ROUTE', 'BUS_STOP', 'ATTENDANCE', 'SAFETY', 'OTHER'] })
  @IsString()
  @IsOptional()
  @IsIn(['BUS', 'DRIVER', 'ROUTE', 'BUS_STOP', 'ATTENDANCE', 'SAFETY', 'OTHER'])
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Filter by bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
