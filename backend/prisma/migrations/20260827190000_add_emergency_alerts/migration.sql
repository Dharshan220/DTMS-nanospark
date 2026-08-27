-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('MEDICAL', 'ACCIDENT', 'SAFETY', 'BREAKDOWN', 'HARASSMENT', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "student_id" TEXT,
    "faculty_id" TEXT,
    "bus_id" TEXT,
    "route_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "location_accuracy" DOUBLE PRECISION,
    "message" TEXT,
    "type" "EmergencyType" NOT NULL,
    "priority" "EmergencyPriority" NOT NULL DEFAULT 'CRITICAL',
    "status" "EmergencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emergency_alerts_user_id_idx" ON "emergency_alerts"("user_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_student_id_idx" ON "emergency_alerts"("student_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_faculty_id_idx" ON "emergency_alerts"("faculty_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_bus_id_idx" ON "emergency_alerts"("bus_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_route_id_idx" ON "emergency_alerts"("route_id");

-- CreateIndex
CREATE INDEX "emergency_alerts_status_idx" ON "emergency_alerts"("status");

-- CreateIndex
CREATE INDEX "emergency_alerts_priority_idx" ON "emergency_alerts"("priority");

-- CreateIndex
CREATE INDEX "emergency_alerts_type_idx" ON "emergency_alerts"("type");

-- CreateIndex
CREATE INDEX "emergency_alerts_created_at_idx" ON "emergency_alerts"("created_at");

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
