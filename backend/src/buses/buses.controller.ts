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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Buses')
@ApiBearerAuth('access-token')
@Controller('admin/buses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bus', description: 'Registers a new bus in the system. Admin only.' })
  @ApiBody({ type: CreateBusDto })
  @ApiResponse({ status: 201, description: 'Bus created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
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
  @ApiOperation({ summary: 'List all buses', description: 'Returns a paginated list of all buses.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term to filter buses' })
  @ApiResponse({ status: 200, description: 'List of buses returned successfully.' })
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
  @ApiOperation({ summary: 'Get a bus by ID', description: 'Returns a single bus by its ID.' })
  @ApiParam({ name: 'id', description: 'Bus ID' })
  @ApiResponse({ status: 200, description: 'Bus found and returned.' })
  findOne(@Param('id') id: string) {
    return this.busesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bus', description: 'Updates bus details by ID. Admin only.' })
  @ApiParam({ name: 'id', description: 'Bus ID' })
  @ApiBody({ type: UpdateBusDto })
  @ApiResponse({ status: 200, description: 'Bus updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
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
  @ApiOperation({ summary: 'Update bus status', description: 'Changes the operational status of a bus. Admin only.' })
  @ApiParam({ name: 'id', description: 'Bus ID' })
  @ApiBody({ type: UpdateBusStatusDto })
  @ApiResponse({ status: 200, description: 'Bus status updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBusStatusDto) {
    return this.busesService.updateStatus(id, dto.status as BusStatus);
  }

  @Patch(':id/driver')
  @ApiOperation({ summary: 'Assign or remove driver', description: 'Assigns or removes a driver from a bus. Admin only.' })
  @ApiParam({ name: 'id', description: 'Bus ID' })
  @ApiBody({ type: AssignDriverDto })
  @ApiResponse({ status: 200, description: 'Driver assignment updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: admin access required' })
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.busesService.assignDriver(id, dto);
  }
}
