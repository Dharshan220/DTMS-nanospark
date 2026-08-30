import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, UpdateStudentStatusDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('admin/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student', description: 'Create a new student account. Admin only.' })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all students', description: 'Retrieve a paginated list of students with optional search.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email', example: 'john' })
  @ApiResponse({ status: 200, description: 'List of students returned' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.studentsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID', description: 'Retrieve a single student by their ID.' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student found' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student', description: 'Update student details. Admin only.' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update student status', description: 'Activate or deactivate a student account. Admin only.' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiBody({ type: UpdateStudentStatusDto })
  @ApiResponse({ status: 200, description: 'Student status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.studentsService.updateStatus(id, dto.status as 'ACTIVE' | 'INACTIVE', user.id);
  }
}
