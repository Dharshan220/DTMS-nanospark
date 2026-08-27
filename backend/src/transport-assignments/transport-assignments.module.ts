import { Module } from '@nestjs/common';
import { TransportAssignmentsService } from './transport-assignments.service';
import { TransportAssignmentsController } from './transport-assignments.controller';

@Module({
  controllers: [TransportAssignmentsController],
  providers: [TransportAssignmentsService],
  exports: [TransportAssignmentsService],
})
export class TransportAssignmentsModule {}
