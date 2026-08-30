import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RouteStopsService } from './route-stops.service';
import { AddStopToRouteDto, UpdateRouteStopDto, ReorderStopsDto } from './dto/route-stop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Route Stops')
@ApiBearerAuth('access-token')
@Controller('admin/routes/:routeId/stops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class RouteStopsController {
  constructor(private readonly routeStopsService: RouteStopsService) {}

  @Get()
  @ApiOperation({ summary: 'List stops for a route', description: 'Returns all bus stops assigned to a specific route.' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiResponse({ status: 200, description: 'List of route stops returned successfully.' })
  getRouteStops(@Param('routeId') routeId: string) {
    return this.routeStopsService.getRouteStops(routeId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a stop to a route', description: 'Adds a bus stop to the specified route.' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiResponse({ status: 201, description: 'Stop added to route successfully.' })
  addStop(@Param('routeId') routeId: string, @Body() dto: AddStopToRouteDto) {
    return this.routeStopsService.addStopToRoute(routeId, dto);
  }

  @Patch(':routeStopId')
  @ApiOperation({ summary: 'Update a route stop', description: 'Updates details of a specific stop within a route.' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiParam({ name: 'routeStopId', description: 'Route stop ID' })
  @ApiResponse({ status: 200, description: 'Route stop updated successfully.' })
  updateRouteStop(
    @Param('routeId') routeId: string,
    @Param('routeStopId') routeStopId: string,
    @Body() dto: UpdateRouteStopDto,
  ) {
    return this.routeStopsService.updateRouteStop(routeId, routeStopId, dto);
  }

  @Delete(':routeStopId')
  @ApiOperation({ summary: 'Remove a stop from a route', description: 'Removes a bus stop from the specified route.' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiParam({ name: 'routeStopId', description: 'Route stop ID' })
  @ApiResponse({ status: 200, description: 'Stop removed from route successfully.' })
  removeStop(@Param('routeId') routeId: string, @Param('routeStopId') routeStopId: string) {
    return this.routeStopsService.removeStopFromRoute(routeId, routeStopId);
  }

  @Patch('reorder/all')
  @ApiOperation({ summary: 'Reorder stops on a route', description: 'Reorders all stops for a route based on the provided ID list.' })
  @ApiParam({ name: 'routeId', description: 'Route ID' })
  @ApiResponse({ status: 200, description: 'Stops reordered successfully.' })
  reorderStops(@Param('routeId') routeId: string, @Body() dto: ReorderStopsDto) {
    return this.routeStopsService.reorderStops(routeId, dto.routeStopIds);
  }
}
