import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacultyDto {
  @ApiProperty({ description: 'Faculty email address', example: 'faculty@example.com', format: 'email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Faculty password (minimum 6 characters)', example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Faculty ID number', example: 'FAC2024001' })
  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @ApiProperty({ description: 'Faculty full name', example: 'Dr. Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Faculty phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Computer Science' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Designation or title', example: 'Assistant Professor' })
  @IsString()
  @IsOptional()
  designation?: string;
}

export class UpdateFacultyDto {
  @ApiPropertyOptional({ description: 'Faculty full name', example: 'Dr. Johnson' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Faculty phone number', example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Computer Science' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Designation or title', example: 'Associate Professor' })
  @IsString()
  @IsOptional()
  designation?: string;
}

export class UpdateFacultyStatusDto {
  @ApiProperty({ description: 'Account status', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status: string;
}
