import { Module } from '@nestjs/common';
import { BusStopsService } from './bus-stops.service';
import { BusStopsController } from './bus-stops.controller';

@Module({
  controllers: [BusStopsController],
  providers: [BusStopsService],
  exports: [BusStopsService],
})
export class BusStopsModule {}
