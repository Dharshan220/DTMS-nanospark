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
  @IsNumber()
  @Min(0)
  boysCount: number;

  @IsNumber()
  @Min(0)
  girlsCount: number;

  @IsNumber()
  @Min(0)
  totalCount: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['MORNING', 'EVENING'])
  tripType: string;
}

export class UpdateAttendanceDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  boysCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  girlsCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCount?: number;
}

export class AttendanceFilterDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  busId?: string;

  @IsString()
  @IsOptional()
  facultyId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MORNING', 'EVENING'])
  tripType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  all?: string;
}
