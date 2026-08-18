import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

const MAINTENANCE_TYPES = ["routine", "repair", "accident", "inspection"];
const MAINTENANCE_STATUSES = ["scheduled", "in_progress", "completed"];

/**
 * Bus maintenance records. Admins manage records; teachers can view
 * maintenance for their assigned bus.
 */
router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  let list = collection("maintenance");
  if (req.auth.role === "teacher") {
    const teacher = collection("users").find((u) => u.id === req.auth.sub);
    const routeNumber = teacher ? teacher.routeNumber : null;
    const bus = collection("buses").find((b) => b.routeNumber === routeNumber);
    list = bus ? list.filter((m) => m.busId === bus.id) : [];
  } else if (req.auth.role !== "admin") {
    list = [];
  }
  const buses = collection("buses");
  list = list.map((m) => {
    const bus = buses.find((b) => b.id === m.busId);
    return { ...m, busNumber: bus ? bus.vehicleNumber : null, routeNumber: bus ? bus.routeNumber : null };
  });
  list = list.sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1));
  res.json({ items: list, total: list.length });
}));

router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { busId, type, serviceDate, nextServiceDate, description, cost, status } = req.body;
  if (!busId || !serviceDate) {
    return res.status(400).json({ message: "busId and serviceDate are required" });
  }
  if (!collection("buses").some((b) => b.id === busId)) {
    return res.status(404).json({ message: "Bus not found" });
  }
  const record = {
    id: await nextId("mnt"),
    busId,
    type: MAINTENANCE_TYPES.includes(type) ? type : "routine",
    serviceDate: String(serviceDate),
    nextServiceDate: nextServiceDate || null,
    description: description || null,
    cost: cost == null ? null : Number(cost),
    status: MAINTENANCE_STATUSES.includes(status) ? status : "scheduled",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  collection("maintenance").unshift(record);
  save();
  res.status(201).json({ record });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const record = collection("maintenance").find((m) => m.id === req.params.id);
  if (!record) return res.status(404).json({ message: "Maintenance record not found" });
  const { busId, type, serviceDate, nextServiceDate, description, cost, status } = req.body;
  if (busId !== undefined) record.busId = busId;
  if (type !== undefined) record.type = MAINTENANCE_TYPES.includes(type) ? type : record.type;
  if (serviceDate !== undefined) record.serviceDate = String(serviceDate);
  if (nextServiceDate !== undefined) record.nextServiceDate = nextServiceDate || null;
  if (description !== undefined) record.description = description;
  if (cost !== undefined) record.cost = cost == null ? null : Number(cost);
  if (status !== undefined) record.status = MAINTENANCE_STATUSES.includes(status) ? status : record.status;
  record.updatedAt = Date.now();
  save();
  res.json({ record });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const list = collection("maintenance");
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Maintenance record not found" });
  list.splice(idx, 1);
  save();
  res.json({ message: "Maintenance record deleted" });
}));

export default router;