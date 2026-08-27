import { Controller, Get, UseGuards } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('faculty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FACULTY)
export class FacultyProfileController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.facultyService.getProfile(user.id);
  }
}
