-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScheduleOverrideStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'REPLACED');

-- AlterEnum
ALTER TYPE "TransportEventType" ADD VALUE 'SCHEDULE_CREATED';
ALTER TYPE "TransportEventType" ADD VALUE 'SCHEDULE_CHANGED';
ALTER TYPE "TransportEventType" ADD VALUE 'SCHEDULE_TIME_CHANGED';
ALTER TYPE "TransportEventType" ADD VALUE 'TRIP_CANCELLED';
ALTER TYPE "TransportEventType" ADD VALUE 'BUS_REPLACED_SCHEDULE';

-- CreateTable
CREATE TABLE "transport_schedules" (
    "id" TEXT NOT NULL,
    "bus_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "trip_type" "TripType" NOT NULL,
    "departure_time" TEXT NOT NULL,
    "expected_arrival_time" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_until" TIMESTAMP(3),
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_overrides" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "replacement_bus_id" TEXT,
    "status" "ScheduleOverrideStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transport_schedules_bus_id_idx" ON "transport_schedules"("bus_id");

-- CreateIndex
CREATE INDEX "transport_schedules_route_id_idx" ON "transport_schedules"("route_id");

-- CreateIndex
CREATE INDEX "transport_schedules_trip_type_idx" ON "transport_schedules"("trip_type");

-- CreateIndex
CREATE INDEX "transport_schedules_status_idx" ON "transport_schedules"("status");

-- CreateIndex
CREATE INDEX "transport_schedules_effective_from_idx" ON "transport_schedules"("effective_from");

-- CreateIndex
CREATE INDEX "transport_schedules_effective_until_idx" ON "transport_schedules"("effective_until");

-- CreateIndex
CREATE INDEX "schedule_overrides_schedule_id_idx" ON "schedule_overrides"("schedule_id");

-- CreateIndex
CREATE INDEX "schedule_overrides_date_idx" ON "schedule_overrides"("date");

-- CreateIndex
CREATE INDEX "schedule_overrides_replacement_bus_id_idx" ON "schedule_overrides"("replacement_bus_id");

-- CreateIndex
CREATE INDEX "schedule_overrides_status_idx" ON "schedule_overrides"("status");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_overrides_schedule_id_date_key" ON "schedule_overrides"("schedule_id", "date");

-- AddForeignKey
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_schedules" ADD CONSTRAINT "transport_schedules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_overrides" ADD CONSTRAINT "schedule_overrides_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "transport_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_overrides" ADD CONSTRAINT "schedule_overrides_replacement_bus_id_fkey" FOREIGN KEY ("replacement_bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
