-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "route_code" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_stops" (
    "id" TEXT NOT NULL,
    "stop_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "bus_stop_id" TEXT NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "estimated_arrival_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_bus_assignments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "bus_id" TEXT NOT NULL,
    "bus_stop_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_bus_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_bus_assignments" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "bus_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_bus_assignments_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add routeId to buses
ALTER TABLE "buses" ADD COLUMN "route_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "routes_route_code_key" ON "routes"("route_code");

-- CreateIndex
CREATE INDEX "routes_route_code_idx" ON "routes"("route_code");

-- CreateIndex
CREATE INDEX "routes_route_name_idx" ON "routes"("route_name");

-- CreateIndex
CREATE UNIQUE INDEX "bus_stops_stop_code_key" ON "bus_stops"("stop_code");

-- CreateIndex
CREATE INDEX "bus_stops_stop_code_idx" ON "bus_stops"("stop_code");

-- CreateIndex
CREATE INDEX "bus_stops_name_idx" ON "bus_stops"("name");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_route_id_bus_stop_id_key" ON "route_stops"("route_id", "bus_stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_route_id_stop_order_key" ON "route_stops"("route_id", "stop_order");

-- CreateIndex
CREATE INDEX "route_stops_route_id_idx" ON "route_stops"("route_id");

-- CreateIndex
CREATE INDEX "route_stops_bus_stop_id_idx" ON "route_stops"("bus_stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_bus_assignments_student_id_key" ON "student_bus_assignments"("student_id");

-- CreateIndex
CREATE INDEX "student_bus_assignments_student_id_idx" ON "student_bus_assignments"("student_id");

-- CreateIndex
CREATE INDEX "student_bus_assignments_bus_id_idx" ON "student_bus_assignments"("bus_id");

-- CreateIndex
CREATE INDEX "student_bus_assignments_bus_stop_id_idx" ON "student_bus_assignments"("bus_stop_id");

-- CreateIndex
CREATE INDEX "student_bus_assignments_status_idx" ON "student_bus_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_bus_assignments_faculty_id_key" ON "faculty_bus_assignments"("faculty_id");

-- CreateIndex
CREATE INDEX "faculty_bus_assignments_faculty_id_idx" ON "faculty_bus_assignments"("faculty_id");

-- CreateIndex
CREATE INDEX "faculty_bus_assignments_bus_id_idx" ON "faculty_bus_assignments"("bus_id");

-- CreateIndex
CREATE INDEX "faculty_bus_assignments_status_idx" ON "faculty_bus_assignments"("status");

-- CreateIndex
CREATE INDEX "buses_route_id_idx" ON "buses"("route_id");

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_bus_stop_id_fkey" FOREIGN KEY ("bus_stop_id") REFERENCES "bus_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_bus_assignments" ADD CONSTRAINT "student_bus_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_bus_assignments" ADD CONSTRAINT "student_bus_assignments_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_bus_assignments" ADD CONSTRAINT "student_bus_assignments_bus_stop_id_fkey" FOREIGN KEY ("bus_stop_id") REFERENCES "bus_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_bus_assignments" ADD CONSTRAINT "faculty_bus_assignments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_bus_assignments" ADD CONSTRAINT "faculty_bus_assignments_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
