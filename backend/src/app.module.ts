import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
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
import { ComplaintsModule } from './complaints/complaints.module';
import { FeedbackModule } from './feedback/feedback.module';
import { EmergencyModule } from './emergency/emergency.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulesModule } from './schedules/schedules.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CommonModule,
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
    ComplaintsModule,
    FeedbackModule,
    EmergencyModule,
    NotificationsModule,
    SchedulesModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
