import { IsOptional, IsString, IsDateString, Matches } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD format' })
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD format' })
  to?: string;
}

export class AttendanceAnalyticsDto extends DateRangeDto {
  @IsOptional()
  @IsString()
  busId?: string;

  @IsOptional()
  @IsString()
  routeId?: string;
}
