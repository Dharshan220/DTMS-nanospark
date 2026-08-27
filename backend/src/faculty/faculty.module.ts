import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultyProfileController } from './faculty-profile.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FacultyController, FacultyProfileController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
