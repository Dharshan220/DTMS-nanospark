import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { BusesService } from './buses.service';
import {
  CreateBusDto,
  UpdateBusDto,
  UpdateBusStatusDto,
  AssignDriverDto,
} from './dto/bus.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, BusStatus } from '@prisma/client';

@Controller('admin/buses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    dto: CreateBusDto,
  ) {
    return this.busesService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.busesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    dto: UpdateBusDto,
  ) {
    return this.busesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBusStatusDto) {
    return this.busesService.updateStatus(id, dto.status as BusStatus);
  }

  @Patch(':id/driver')
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.busesService.assignDriver(id, dto);
  }
}
