import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const list = collection("attendance");
  const { studentId, month } = req.query;
  let mine;
  if (req.auth.role === "admin" && studentId) {
    mine = list.filter((a) => a.studentId === studentId);
  } else if (req.auth.role === "teacher") {
    // Faculty sees attendance of the students on their assigned route.
    const teacher = collection("users").find((u) => u.id === req.auth.sub);
    const routeNumber = teacher ? teacher.routeNumber : null;
    mine = routeNumber == null ? [] : list.filter((a) => a.routeNumber === routeNumber);
  } else {
    mine = list.filter((a) => a.studentId === req.auth.sub);
  }
  if (month) mine = mine.filter((a) => a.date.startsWith(String(month)));
  mine = mine.sort((a, b) => (a.date < b.date ? 1 : -1));
  const present = mine.filter((a) => a.status === "present").length;
  res.json({
    items: mine,
    present,
    absent: mine.length - present,
    total: mine.length,
  });
}));

/**
 * Student check-in for today (once per day).
 */
router.post("/check-in", requireAuth(), asyncHandler(async (req, res) => {
  const { busId, routeNumber, stopName } = req.body;
  const today = new Date().toISOString().slice(0, 10);
  const list = collection("attendance");
  const dup = list.find((a) => a.studentId === req.auth.sub && a.date === today);
  if (dup) return res.json({ attendance: dup, already: true });
  const entry = {
    id: await nextId("att"),
    studentId: req.auth.sub,
    date: today,
    busId: busId || null,
    routeNumber: routeNumber ? Number(routeNumber) : null,
    status: "present",
    checkInAt: new Date().toISOString(),
    checkInStop: stopName || null,
  };
  list.unshift(entry);
  save();
  res.status(201).json({ attendance: entry, already: false });
}));

const TRIP_TYPES = ["morning", "evening"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function teacherBus(req) {
  const teacher = collection("users").find((u) => u.id === req.auth.sub);
  if (!teacher || teacher.routeNumber == null) return null;
  return collection("buses").find((b) => b.routeNumber === teacher.routeNumber) || null;
}

function validateCount(body) {
  const { date, tripType } = body;
  const boys = Number(body.boys);
  const girls = Number(body.girls);
  const total = Number(body.total);
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    return { error: "Invalid date" };
  }
  if (!TRIP_TYPES.includes(tripType)) {
    return { error: "Invalid trip type" };
  }
  if (!Number.isInteger(boys) || boys < 0) {
    return { error: "Boys count must be a non-negative whole number" };
  }
  if (!Number.isInteger(girls) || girls < 0) {
    return { error: "Girls count must be a non-negative whole number" };
  }
  if (!Number.isInteger(total) || total < 0) {
    return { error: "Total count must be a non-negative whole number" };
  }
  if (total !== boys + girls) {
    return { error: "Total must equal Boys + Girls" };
  }
  return { value: { date, tripType, boys, girls, total } };
}

/**
 * Passenger counts recorded by faculty for their assigned bus.
 * One record per (date, tripType, bus). Teachers can only read the
 * counts of the bus assigned to their route.
 */
router.get("/passenger-counts", requireAuth(), asyncHandler(async (req, res) => {
  if (req.auth.role !== "teacher" && req.auth.role !== "admin") {
    return res.status(403).json({ message: "Only faculty or admins can view passenger counts" });
  }
  const list = collection("passengerCounts");
  let mine;
  if (req.auth.role === "admin") {
    mine = list;
  } else {
    const bus = teacherBus(req);
    mine = bus ? list.filter((c) => c.busId === bus.id) : [];
  }
  mine = mine.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json({ items: mine, total: mine.length });
}));

/**
 * Create or update the passenger count for a (date, trip, bus) combo.
 * Teachers can only write counts for the bus assigned to their route.
 */
router.put("/passenger-counts", requireAuth(), asyncHandler(async (req, res) => {
  if (req.auth.role !== "teacher" && req.auth.role !== "admin") {
    return res.status(403).json({ message: "Only faculty or admins can record passenger counts" });
  }
  const check = validateCount(req.body);
  if (check.error) return res.status(400).json({ message: check.error });

  let bus;
  let busId = req.body.busId;
  if (req.auth.role === "admin") {
    bus = collection("buses").find((b) => b.id === busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
  } else {
    bus = teacherBus(req);
    if (!bus) return res.status(403).json({ message: "No bus assigned to your profile" });
    busId = bus.id;
  }

  const list = collection("passengerCounts");
  const existing = list.find((c) => c.busId === busId && c.date === check.value.date && c.tripType === check.value.tripType);
  const { date, tripType, boys, girls, total } = check.value;
  if (existing) {
    existing.boys = boys;
    existing.girls = girls;
    existing.total = total;
    existing.facultyId = req.auth.sub;
    existing.updatedAt = Date.now();
    save();
    return res.json({ count: existing, created: false });
  }
  const count = {
    id: await nextId("cnt"),
    date,
    busId,
    routeNumber: bus.routeNumber,
    facultyId: req.auth.sub,
    tripType,
    total,
    boys,
    girls,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  list.unshift(count);
  save();
  res.status(201).json({ count, created: true });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const entry = collection("attendance").find((a) => a.id === req.params.id);
  if (!entry) return res.status(404).json({ message: "Attendance record not found" });
  const { status } = req.body;
  if (!["present", "absent"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  entry.status = status;
  save();
  res.json({ attendance: entry });
}));

export default router;