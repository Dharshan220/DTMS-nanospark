import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const buses = collection("buses").map((b) => ({ ...b, busAdminCount: (b.busAdminIds || []).length }));
  res.json({ items: buses, total: buses.length });
}));

router.get("/:id", requireAuth(), asyncHandler(async (req, res) => {
  const bus = collection("buses").find((b) => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  const users = collection("users");
  const admins = (bus.busAdminIds || [])
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, role: u.role, department: u.department, year: u.year, section: u.section }));
  res.json({ ...bus, admins });
}));

router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { routeNumber, vehicleNumber, driverName, driverPhone, capacity, status } = req.body;
  if (!routeNumber || !vehicleNumber) {
    return res.status(400).json({ message: "Route number and vehicle number are required" });
  }
  const bus = {
    id: await nextId("bus"),
    routeNumber: Number(routeNumber),
    vehicleNumber: String(vehicleNumber),
    driverName: driverName || "",
    driverPhone: driverPhone || "",
    capacity: capacity || 60,
    status: ["active", "maintenance", "inactive"].includes(status) ? status : "active",
    busAdminIds: [],
    createdAt: Date.now(),
  };
  collection("buses").push(bus);
  save();
  res.status(201).json({ bus });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const bus = collection("buses").find((b) => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  const { routeNumber, vehicleNumber, driverName, driverPhone, capacity, status } = req.body;
  if (routeNumber !== undefined) bus.routeNumber = Number(routeNumber);
  if (vehicleNumber !== undefined) bus.vehicleNumber = String(vehicleNumber);
  if (driverName !== undefined) bus.driverName = driverName;
  if (driverPhone !== undefined) bus.driverPhone = driverPhone;
  if (capacity !== undefined) bus.capacity = Number(capacity);
  if (status !== undefined) {
    bus.status = ["active", "maintenance", "inactive"].includes(status) ? status : "active";
  }
  save();
  res.json({ bus });
}));

/**
 * Assign student bus admins (max 2). Only students may be bus admins.
 */
router.put("/:id/bus-admins", requireAdmin(), asyncHandler(async (req, res) => {
  const bus = collection("buses").find((b) => b.id === req.params.id);
  if (!bus) return res.status(404).json({ message: "Bus not found" });
  const { adminIds } = req.body;
  if (!Array.isArray(adminIds)) return res.status(400).json({ message: "adminIds must be an array" });
  if (adminIds.length > 2) return res.status(400).json({ message: "A bus can have at most 2 student bus admins" });
  const users = collection("users");
  const valid = adminIds.every((id) => users.some((u) => u.id === id && u.role === "student"));
  if (!valid) return res.status(400).json({ message: "Bus admins must be existing students" });
  // remove old assignments
  for (const b of collection("buses")) {
    b.busAdminIds = (b.busAdminIds || []).filter((id) => !adminIds.includes(id));
  }
  bus.busAdminIds = adminIds;
  save();
  res.json({ bus, adminCount: adminIds.length });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const buses = collection("buses");
  const idx = buses.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Bus not found" });
  buses.splice(idx, 1);
  save();
  res.json({ message: "Bus deleted" });
}));

export default router;