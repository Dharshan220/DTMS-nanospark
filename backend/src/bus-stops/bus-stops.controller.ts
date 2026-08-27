import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { BusStopsService } from './bus-stops.service';
import { CreateBusStopDto, UpdateBusStopDto, UpdateBusStopStatusDto } from './dto/bus-stop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, EntityStatus } from '@prisma/client';

@Controller('admin/bus-stops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BusStopsController {
  constructor(private readonly busStopsService: BusStopsService) {}

  @Post()
  create(@Body() dto: CreateBusStopDto) {
    return this.busStopsService.create(dto);
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.busStopsService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busStopsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusStopDto) {
    return this.busStopsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBusStopStatusDto) {
    return this.busStopsService.updateStatus(id, dto.status as EntityStatus);
  }
}
