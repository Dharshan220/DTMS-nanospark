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

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'])
  category: string;
}

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @IsIn(['SUBMITTED', 'REVIEWED', 'RESOLVED'])
  status?: string;
}

export class FeedbackFilterDto {
  @IsString()
  @IsOptional()
  @IsIn(['SUBMITTED', 'REVIEWED', 'RESOLVED'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['BUS', 'ROUTE', 'DRIVER', 'FACULTY', 'SERVICE', 'OTHER'])
  category?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
