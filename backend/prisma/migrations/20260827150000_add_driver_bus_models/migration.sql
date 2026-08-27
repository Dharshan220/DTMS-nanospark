-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "driver_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "license_number" TEXT NOT NULL,
    "license_expiry" TIMESTAMP(3),
    "experience_years" INTEGER,
    "address" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" TEXT NOT NULL,
    "bus_number" INTEGER NOT NULL,
    "registration_number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "boys_capacity" INTEGER,
    "girls_capacity" INTEGER,
    "driver_id" TEXT,
    "status" "BusStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drivers_driver_code_key" ON "drivers"("driver_code");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "drivers_driver_code_idx" ON "drivers"("driver_code");

-- CreateIndex
CREATE INDEX "drivers_name_idx" ON "drivers"("name");

-- CreateIndex
CREATE INDEX "drivers_phone_idx" ON "drivers"("phone");

-- CreateIndex
CREATE INDEX "drivers_license_number_idx" ON "drivers"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "buses_bus_number_key" ON "buses"("bus_number");

-- CreateIndex
CREATE UNIQUE INDEX "buses_registration_number_key" ON "buses"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "buses_driver_id_key" ON "buses"("driver_id");

-- CreateIndex
CREATE INDEX "buses_bus_number_idx" ON "buses"("bus_number");

-- CreateIndex
CREATE INDEX "buses_registration_number_idx" ON "buses"("registration_number");

-- CreateIndex
CREATE INDEX "buses_driver_id_idx" ON "buses"("driver_id");

-- CreateIndex
CREATE INDEX "buses_status_idx" ON "buses"("status");

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
