import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentProfileController } from './student-profile.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [StudentsController, StudentProfileController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
