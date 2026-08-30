import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentProfileController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile', description: 'Return the authenticated student\'s profile.' })
  @ApiResponse({ status: 200, description: 'Student profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.studentsService.getProfile(user.id);
  }
}
