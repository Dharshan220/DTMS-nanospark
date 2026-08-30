import { Module } from '@nestjs/common';
import { TransportAssignmentsService } from './transport-assignments.service';
import { TransportAssignmentsController } from './transport-assignments.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TransportAssignmentsController],
  providers: [TransportAssignmentsService],
  exports: [TransportAssignmentsService],
})
export class TransportAssignmentsModule {}
