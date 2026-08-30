import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Faculty')
@ApiBearerAuth('access-token')
@Controller('faculty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FACULTY)
export class FacultyProfileController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile', description: 'Return the authenticated faculty member\'s profile.' })
  @ApiResponse({ status: 200, description: 'Faculty profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.facultyService.getProfile(user.id);
  }
}
