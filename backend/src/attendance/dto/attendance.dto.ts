import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'PassengerCount', async: false })
export class PassengerCountValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    const boys = obj.boysCount || 0;
    const girls = obj.girlsCount || 0;
    const total = obj.totalCount || 0;
    return boys + girls === total;
  }

  defaultMessage() {
    return 'totalCount must equal boysCount + girlsCount';
  }
}

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Number of male passengers', example: 15, minimum: 0 })
  @IsNumber()
  @Min(0)
  boysCount: number;

  @ApiProperty({ description: 'Number of female passengers', example: 12, minimum: 0 })
  @IsNumber()
  @Min(0)
  girlsCount: number;

  @ApiProperty({ description: 'Total passenger count (boys + girls)', example: 27, minimum: 0 })
  @IsNumber()
  @Min(0)
  totalCount: number;

  @ApiPropertyOptional({ description: 'Attendance date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ description: 'Trip type', enum: ['MORNING', 'EVENING'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['MORNING', 'EVENING'])
  tripType: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ description: 'Updated male passenger count', example: 16, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCount?: number;

  @ApiPropertyOptional({ description: 'Updated female passenger count', example: 13, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCount?: number;

  @ApiPropertyOptional({ description: 'Updated total passenger count', example: 29, minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCount?: number;
}

export class AttendanceFilterDto {
  @ApiPropertyOptional({ description: 'Filter start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter end date (YYYY-MM-DD)', example: '2026-08-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by bus ID' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiPropertyOptional({ description: 'Filter by faculty ID' })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'Filter by trip type', enum: ['MORNING', 'EVENING'] })
  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @ApiPropertyOptional({ description: 'Filter all records', enum: ['true', 'false'] })
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  all?: string;
}
