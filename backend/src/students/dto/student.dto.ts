import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: 'Student email address', example: 'student@example.com', format: 'email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Student password (minimum 6 characters)', example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Student register number', example: 'REG2024001' })
  @IsString()
  @IsNotEmpty()
  registerNumber: string;

  @ApiProperty({ description: 'Student full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Student phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Computer Science' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Year of study', enum: ['I', 'II', 'III', 'IV'], example: 'II' })
  @IsString()
  @IsOptional()
  @IsIn(['I', 'II', 'III', 'IV'])
  year?: string;

  @ApiPropertyOptional({ description: 'Section', enum: ['A', 'B', 'C'], example: 'A' })
  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  section?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: ['male', 'female'], example: 'male' })
  @IsString()
  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ description: 'Student full name', example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Student phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Computer Science' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Year of study', enum: ['I', 'II', 'III', 'IV'], example: 'III' })
  @IsString()
  @IsOptional()
  @IsIn(['I', 'II', 'III', 'IV'])
  year?: string;

  @ApiPropertyOptional({ description: 'Section', enum: ['A', 'B', 'C'], example: 'B' })
  @IsString()
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  section?: string;

  @ApiPropertyOptional({ description: 'Gender', enum: ['male', 'female'], example: 'female' })
  @IsString()
  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}

export class UpdateStudentStatusDto {
  @ApiProperty({ description: 'Account status', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
