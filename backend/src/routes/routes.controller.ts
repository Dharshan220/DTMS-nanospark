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
  ApiBody,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto, UpdateRouteStatusDto } from './dto/route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, EntityStatus } from '@prisma/client';

@ApiTags('Routes')
@ApiBearerAuth('access-token')
@Controller('admin/routes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new route', description: 'Registers a new route in the system. Admin only.' })
  @ApiBody({ type: CreateRouteDto })
  @ApiResponse({ status: 201, description: 'Route created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all routes', description: 'Returns a paginated list of all routes.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter routes' })
  @ApiResponse({ status: 200, description: 'List of routes returned successfully.' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.routesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a route by ID', description: 'Returns a single route by its ID.' })
  @ApiParam({ name: 'id', description: 'Route ID' })
  @ApiResponse({ status: 200, description: 'Route found and returned.' })
  findOne(@Param('id') id: string) {
    return this.routesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a route', description: 'Updates route details by ID. Admin only.' })
  @ApiParam({ name: 'id', description: 'Route ID' })
  @ApiBody({ type: UpdateRouteDto })
  @ApiResponse({ status: 200, description: 'Route updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update route status', description: 'Changes the status of a route. Admin only.' })
  @ApiParam({ name: 'id', description: 'Route ID' })
  @ApiBody({ type: UpdateRouteStatusDto })
  @ApiResponse({ status: 200, description: 'Route status updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRouteStatusDto) {
    return this.routesService.updateStatus(id, dto.status as EntityStatus);
  }
}
