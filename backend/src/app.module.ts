import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { FacultyModule } from './faculty/faculty.module';
import { DriversModule } from './drivers/drivers.module';
import { BusesModule } from './buses/buses.module';
import { RoutesModule } from './routes/routes.module';
import { BusStopsModule } from './bus-stops/bus-stops.module';
import { RouteStopsModule } from './route-stops/route-stops.module';
import { TransportAssignmentsModule } from './transport-assignments/transport-assignments.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    StudentsModule,
    FacultyModule,
    DriversModule,
    BusesModule,
    RoutesModule,
    BusStopsModule,
    RouteStopsModule,
    TransportAssignmentsModule,
    AttendanceModule,
    HealthModule,
  ],
})
export class AppModule {}
