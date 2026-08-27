import { Module } from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { RouteStopsController } from './route-stops.controller';

@Module({
  controllers: [RouteStopsController],
  providers: [RouteStopsService],
  exports: [RouteStopsService],
})
export class RouteStopsModule {}
