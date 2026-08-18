import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

const DRIVER_STATUSES = ["active", "inactive", "on_leave"];

/**
 * Sync the assigned bus with the driver record so the bus list always
 * reflects the current driver (name/phone are mirrored on the bus for
 * Flutter app compatibility).
 */
function syncBusAssignment(busId, driver) {
  const buses = collection("buses");
  // clear previous assignment
  const prev = buses.find((b) => b.driverId === driver.id);
  if (prev && prev.id !== busId) {
    prev.driverId = null;
    prev.driverName = "";
    prev.driverPhone = "";
  }
  if (busId) {
    const bus = buses.find((b) => b.id === busId);
    if (!bus) return false;
    // clear the bus from any other driver
    for (const b of buses) {
      if (b.driverId === driver.id && b.id !== busId) {
        b.driverId = null;
        b.driverName = "";
        b.driverPhone = "";
      }
    }
    bus.driverId = driver.id;
    bus.driverName = driver.name;
    bus.driverPhone = driver.phone || "";
  }
  save();
  return true;
}

router.get("/", requireAdmin(), asyncHandler(async (_req, res) => {
  const buses = collection("buses");
  const drivers = collection("drivers").map((d) => {
    const bus = d.assignedBusId ? buses.find((b) => b.id === d.assignedBusId) : null;
    return { ...d, assignedBusRoute: bus ? bus.routeNumber : null, assignedVehicle: bus ? bus.vehicleNumber : null };
  });
  res.json({ items: drivers, total: drivers.length });
}));

router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { name, phone, licenseNumber, licenseExpiry, experienceYears, status, assignedBusId } = req.body;
  if (!name) return res.status(400).json({ message: "Driver name is required" });
  const driver = {
    id: await nextId("drv"),
    name: String(name).trim(),
    phone: phone ? String(phone) : null,
    licenseNumber: licenseNumber || null,
    licenseExpiry: licenseExpiry || null,
    experienceYears: experienceYears == null ? null : Number(experienceYears),
    status: DRIVER_STATUSES.includes(status) ? status : "active",
    assignedBusId: assignedBusId || null,
    createdAt: Date.now(),
  };
  if (driver.assignedBusId) {
    const bus = collection("buses").find((b) => b.id === driver.assignedBusId);
    if (!bus) return res.status(404).json({ message: "Assigned bus not found" });
    syncBusAssignment(driver.assignedBusId, driver);
  }
  collection("drivers").push(driver);
  save();
  res.status(201).json({ driver });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const driver = collection("drivers").find((d) => d.id === req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  const { name, phone, licenseNumber, licenseExpiry, experienceYears, status } = req.body;
  if (name !== undefined) driver.name = String(name).trim();
  if (phone !== undefined) driver.phone = phone ? String(phone) : null;
  if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
  if (licenseExpiry !== undefined) driver.licenseExpiry = licenseExpiry;
  if (experienceYears !== undefined) driver.experienceYears = experienceYears == null ? null : Number(experienceYears);
  if (status !== undefined) driver.status = DRIVER_STATUSES.includes(status) ? status : driver.status;
  if (driver.assignedBusId) {
    const bus = collection("buses").find((b) => b.id === driver.assignedBusId);
    if (bus) {
      bus.driverName = driver.name;
      bus.driverPhone = driver.phone || "";
    }
  }
  save();
  res.json({ driver });
}));

/**
 * Assign (or unassign with busId=null) a bus to a driver.
 */
router.put("/:id/assign-bus", requireAdmin(), asyncHandler(async (req, res) => {
  const driver = collection("drivers").find((d) => d.id === req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  const { busId } = req.body;
  if (!busId) {
    if (driver.assignedBusId) {
      const prev = collection("buses").find((b) => b.id === driver.assignedBusId);
      if (prev && prev.driverId === driver.id) {
        prev.driverId = null;
        prev.driverName = "";
        prev.driverPhone = "";
      }
    }
    driver.assignedBusId = null;
    save();
    return res.json({ driver });
  }
  if (!syncBusAssignment(busId, driver)) {
    return res.status(404).json({ message: "Assigned bus not found" });
  }
  driver.assignedBusId = busId;
  save();
  res.json({ driver });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const list = collection("drivers");
  const idx = list.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Driver not found" });
  const [driver] = list.splice(idx, 1);
  if (driver.assignedBusId) {
    const bus = collection("buses").find((b) => b.id === driver.assignedBusId);
    if (bus && bus.driverId === driver.id) {
      bus.driverId = null;
      bus.driverName = "";
      bus.driverPhone = "";
    }
  }
  save();
  res.json({ message: "Driver deleted" });
}));

export default router;