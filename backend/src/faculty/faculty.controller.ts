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
import { FacultyService } from './faculty.service';
import { CreateFacultyDto, UpdateFacultyDto, UpdateFacultyStatusDto } from './dto/faculty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Faculty')
@ApiBearerAuth('access-token')
@Controller('admin/faculty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new faculty member', description: 'Create a new faculty account. Admin only.' })
  @ApiBody({ type: CreateFacultyDto })
  @ApiResponse({ status: 201, description: 'Faculty member created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  create(@Body() dto: CreateFacultyDto) {
    return this.facultyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all faculty members', description: 'Retrieve a paginated list of faculty with optional search.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email', example: 'john' })
  @ApiResponse({ status: 200, description: 'List of faculty returned' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.facultyService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get faculty member by ID', description: 'Retrieve a single faculty member by their ID.' })
  @ApiParam({ name: 'id', description: 'Faculty UUID' })
  @ApiResponse({ status: 200, description: 'Faculty member found' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  findOne(@Param('id') id: string) {
    return this.facultyService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update faculty member', description: 'Update faculty member details. Admin only.' })
  @ApiParam({ name: 'id', description: 'Faculty UUID' })
  @ApiBody({ type: UpdateFacultyDto })
  @ApiResponse({ status: 200, description: 'Faculty member updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.facultyService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update faculty status', description: 'Activate or deactivate a faculty account. Admin only.' })
  @ApiParam({ name: 'id', description: 'Faculty UUID' })
  @ApiBody({ type: UpdateFacultyStatusDto })
  @ApiResponse({ status: 200, description: 'Faculty status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFacultyStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.facultyService.updateStatus(id, dto.status as 'ACTIVE' | 'INACTIVE', user.id);
  }
}
