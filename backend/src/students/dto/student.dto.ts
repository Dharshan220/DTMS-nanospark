import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsIn,
} from 'class-validator';

export class CreateStudentDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  registerNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  @IsIn(['I', 'II', 'III', 'IV'])
  year?: string;

  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  section?: string;

  @IsString()
  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  @IsIn(['I', 'II', 'III', 'IV'])
  year?: string;

  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  section?: string;

  @IsString()
  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}

export class UpdateStudentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
