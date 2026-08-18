import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

export const EMERGENCY_TYPES = ["accident", "breakdown", "medical", "safety", "other"];
const EMERGENCY_STATUSES = ["active", "acknowledged", "resolved"];

/**
 * Emergency / SOS reports. Faculty report emergencies for their bus;
 * admins acknowledge, respond and resolve them.
 */
router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  let list = collection("emergencies");
  if (req.auth.role !== "admin") {
    list = list.filter((e) => e.reportedById === req.auth.sub);
  }
  list = list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const active = list.filter((e) => e.status === "active" || e.status === "acknowledged");
  res.json({ items: list, total: list.length, activeCount: active.length, active });
}));

router.post("/", requireAuth(), asyncHandler(async (req, res) => {
  const { type, description, location, busId, routeNumber } = req.body;
  if (!EMERGENCY_TYPES.includes(type)) {
    return res.status(400).json({ message: "Invalid emergency type" });
  }
  if (!description) return res.status(400).json({ message: "Description is required" });
  const user = collection("users").find((u) => u.id === req.auth.sub);
  const bus = busId ? collection("buses").find((b) => b.id === busId) : null;
  const entry = {
    id: await nextId("emg"),
    type,
    description: String(description).trim(),
    location: location || null,
    busId: busId || null,
    busNumber: bus ? bus.vehicleNumber : null,
    routeNumber: routeNumber ? Number(routeNumber) : bus ? bus.routeNumber : null,
    reportedById: req.auth.sub,
    reportedByName: user ? user.name : "Unknown",
    status: "active",
    adminResponse: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  collection("emergencies").unshift(entry);
  // notify all admins so an active emergency is never missed
  const now = Date.now();
  for (const a of collection("users").filter((u) => u.role === "admin")) {
    collection("notifications").unshift({
      id: await nextId("ntf"),
      userId: a.id,
      title: "Emergency reported",
      body: `${entry.reportedByName} reported an emergency (${entry.type})${entry.busNumber ? ` on ${entry.busNumber}` : ""}.`,
      type: "emergency",
      read: false,
      createdAt: now,
    });
  }
  save();
  res.status(201).json({ emergency: entry });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const entry = collection("emergencies").find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ message: "Emergency report not found" });
  const { status, response } = req.body;
  if (status !== undefined) {
    if (!EMERGENCY_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    entry.status = status;
  }
  if (response !== undefined) entry.adminResponse = String(response).trim();
  entry.updatedAt = Date.now();
  save();
  res.json({ emergency: entry });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const list = collection("emergencies");
  const idx = list.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Emergency report not found" });
  list.splice(idx, 1);
  save();
  res.json({ message: "Emergency report deleted" });
}));

export default router;