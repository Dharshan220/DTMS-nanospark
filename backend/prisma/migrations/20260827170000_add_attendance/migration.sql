-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('MORNING', 'EVENING');

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "bus_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "trip_type" "TripType" NOT NULL,
    "boys_count" INTEGER NOT NULL DEFAULT 0,
    "girls_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_bus_id_date_trip_type_key" ON "attendance"("bus_id", "date", "trip_type");

-- CreateIndex
CREATE INDEX "attendance_bus_id_idx" ON "attendance"("bus_id");

-- CreateIndex
CREATE INDEX "attendance_faculty_id_idx" ON "attendance"("faculty_id");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_trip_type_idx" ON "attendance"("trip_type");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
