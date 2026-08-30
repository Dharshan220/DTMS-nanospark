import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BusStopsService } from './bus-stops.service';
import { CreateBusStopDto, UpdateBusStopDto, UpdateBusStopStatusDto } from './dto/bus-stop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, EntityStatus } from '@prisma/client';

@ApiTags('Bus Stops')
@ApiBearerAuth('access-token')
@Controller('admin/bus-stops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BusStopsController {
  constructor(private readonly busStopsService: BusStopsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bus stop', description: 'Registers a new bus stop in the system (admin only).' })
  @ApiResponse({ status: 201, description: 'Bus stop created successfully.' })
  create(@Body() dto: CreateBusStopDto) {
    return this.busStopsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all bus stops', description: 'Returns a paginated list of all bus stops.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter bus stops' })
  @ApiResponse({ status: 200, description: 'List of bus stops returned successfully.' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.busStopsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bus stop by ID', description: 'Returns a single bus stop by its ID.' })
  @ApiParam({ name: 'id', description: 'Bus stop ID' })
  @ApiResponse({ status: 200, description: 'Bus stop found and returned.' })
  findOne(@Param('id') id: string) {
    return this.busStopsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bus stop', description: 'Updates bus stop details by ID.' })
  @ApiParam({ name: 'id', description: 'Bus stop ID' })
  @ApiResponse({ status: 200, description: 'Bus stop updated successfully.' })
  update(@Param('id') id: string, @Body() dto: UpdateBusStopDto) {
    return this.busStopsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update bus stop status', description: 'Changes the status of a bus stop.' })
  @ApiParam({ name: 'id', description: 'Bus stop ID' })
  @ApiResponse({ status: 200, description: 'Bus stop status updated successfully.' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBusStopStatusDto) {
    return this.busStopsService.updateStatus(id, dto.status as EntityStatus);
  }
}
