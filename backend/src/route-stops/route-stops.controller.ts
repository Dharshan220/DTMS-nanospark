import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { AddStopToRouteDto, UpdateRouteStopDto, ReorderStopsDto } from './dto/route-stop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/routes/:routeId/stops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class RouteStopsController {
  constructor(private readonly routeStopsService: RouteStopsService) {}

  @Get()
  getRouteStops(@Param('routeId') routeId: string) {
    return this.routeStopsService.getRouteStops(routeId);
  }

  @Post()
  addStop(@Param('routeId') routeId: string, @Body() dto: AddStopToRouteDto) {
    return this.routeStopsService.addStopToRoute(routeId, dto);
  }

  @Patch(':routeStopId')
  updateRouteStop(
    @Param('routeId') routeId: string,
    @Param('routeStopId') routeStopId: string,
    @Body() dto: UpdateRouteStopDto,
  ) {
    return this.routeStopsService.updateRouteStop(routeId, routeStopId, dto);
  }

  @Delete(':routeStopId')
  removeStop(@Param('routeId') routeId: string, @Param('routeStopId') routeStopId: string) {
    return this.routeStopsService.removeStopFromRoute(routeId, routeStopId);
  }

  @Patch('reorder/all')
  reorderStops(@Param('routeId') routeId: string, @Body() dto: ReorderStopsDto) {
    return this.routeStopsService.reorderStops(routeId, dto.routeStopIds);
  }
}
