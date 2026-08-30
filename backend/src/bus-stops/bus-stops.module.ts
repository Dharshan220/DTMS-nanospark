import { Module } from '@nestjs/common';
import { BusStopsService } from './bus-stops.service';
import { BusStopsController } from './bus-stops.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BusStopsController],
  providers: [BusStopsService],
  exports: [BusStopsService],
})
export class BusStopsModule {}
