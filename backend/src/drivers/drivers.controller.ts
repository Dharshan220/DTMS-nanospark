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
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto, UpdateDriverStatusDto } from './dto/driver.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, DriverStatus } from '@prisma/client';

@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new driver', description: 'Registers a new driver in the system. Admin only.' })
  @ApiBody({ type: CreateDriverDto })
  @ApiResponse({ status: 201, description: 'Driver created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all drivers', description: 'Returns a paginated list of all drivers.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter drivers' })
  @ApiResponse({ status: 200, description: 'List of drivers returned successfully.' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.driversService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a driver by ID', description: 'Returns a single driver by their ID.' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver found and returned.' })
  findOne(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a driver', description: 'Updates driver details by ID. Admin only.' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiBody({ type: UpdateDriverDto })
  @ApiResponse({ status: 200, description: 'Driver updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update driver status', description: 'Changes the status of a driver. Admin only.' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiBody({ type: UpdateDriverStatusDto })
  @ApiResponse({ status: 200, description: 'Driver status updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDriverStatusDto) {
    return this.driversService.updateStatus(id, dto.status as DriverStatus);
  }
}
