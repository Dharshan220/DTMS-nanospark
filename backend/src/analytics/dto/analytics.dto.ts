import { IsOptional, IsString, IsDateString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD format' })
  from?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD format' })
  to?: string;
}

export class AttendanceAnalyticsDto extends DateRangeDto {
  @ApiPropertyOptional({ description: 'Filter by bus ID' })
  @IsOptional()
  @IsString()
  busId?: string;

  @ApiPropertyOptional({ description: 'Filter by route ID' })
  @IsOptional()
  @IsString()
  routeId?: string;
}
