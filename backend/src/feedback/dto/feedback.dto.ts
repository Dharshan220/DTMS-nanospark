import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Feedback subject', minLength: 3, maxLength: 200, example: 'Great bus service' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ description: 'Detailed feedback message', minLength: 10, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5, example: 4 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Feedback category', enum: ['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'])
  category: string;
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional({ description: 'Update feedback status', enum: ['SUBMITTED', 'REVIEWED', 'RESOLVED'] })
  @IsString()
  @IsOptional()
  @IsIn(['SUBMITTED', 'REVIEWED', 'RESOLVED'])
  status?: string;
}

export class FeedbackFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['SUBMITTED', 'REVIEWED', 'RESOLVED'] })
  @IsString()
  @IsOptional()
  @IsIn(['SUBMITTED', 'REVIEWED', 'RESOLVED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'] })
  @IsString()
  @IsOptional()
  @IsIn(['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'])
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by rating', minimum: 1, maximum: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

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
