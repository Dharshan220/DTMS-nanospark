import { Router } from "express";
import { collection, save, nextId, paginate } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

export const COMPLAINT_CATEGORIES = [
  "Late Bus",
  "Bus Delay",
  "Cleanliness",
  "Safety",
  "Student Safety",
  "Bus Breakdown",
  "Vehicle Problem",
  "Seat Damage",
  "Route Issue",
  "Driver Issue",
  "Bus Stop Issue",
  "General Complaint",
  "Suggestion",
  "Other",
];

export const COMPLAINT_STATUSES = ["pending", "under_review", "in_progress", "resolved", "escalated"];

/**
 * Enrich a complaint with the reporting student's details and the bus
 * registration number so faculty/admin views do not need extra lookups.
 */
function withStudentInfo(c, users, buses) {
  const student = users.find((u) => u.id === c.userId);
  const bus = (c.busId && buses.find((b) => b.id === c.busId)) || buses.find((b) => b.routeNumber === c.routeNumber);
  return {
    ...c,
    studentRollNo: student ? student.rollNo || null : null,
    studentDepartment: student ? student.department || null : null,
    studentYear: student ? student.year || null : null,
    studentBoardingStop: student ? student.boardingStop || null : null,
    busVehicleNumber: bus ? bus.vehicleNumber || null : null,
    historyByName: (c.history || []).map((h) => {
      const u = users.find((x) => x.id === h.by);
      return { ...h, byName: u ? u.name : "Transport Office" };
    }),
  };
}

/**
 * Teachers can view and act on complaints raised on their assigned route.
 * Everyone keeps visibility of their own complaints.
 */
function canView(req, c) {
  if (req.auth.role === "admin") return true;
  if (c.userId === req.auth.sub) return true;
  if (req.auth.role === "teacher") {
    const teacher = collection("users").find((u) => u.id === req.auth.sub);
    return Boolean(teacher && teacher.routeNumber && c.routeNumber === teacher.routeNumber);
  }
  return false;
}

function canManage(req, c) {
  if (req.auth.role === "admin") return true;
  if (req.auth.role === "teacher") {
    const teacher = collection("users").find((u) => u.id === req.auth.sub);
    return Boolean(teacher && teacher.routeNumber && c.routeNumber === teacher.routeNumber);
  }
  return false;
}

function effectiveCategories() {
  const settings = collection("settings");
  if (settings.length > 0 && Array.isArray(settings[0].complaintCategories) && settings[0].complaintCategories.length > 0) {
    return settings[0].complaintCategories;
  }
  return COMPLAINT_CATEGORIES;
}

router.get("/categories", requireAuth(), (_req, res) => res.json({ categories: effectiveCategories() }));

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const { status, category, page, limit } = req.query;
  const users = collection("users");
  const buses = collection("buses");
  let list = collection("complaints").filter((c) => canView(req, c));
  if (status) list = list.filter((c) => c.status === status);
  if (category) list = list.filter((c) => c.category === category);
  list = list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  const result = paginate(list, page, limit);
  res.json({ ...result, items: result.items.map((c) => withStudentInfo(c, users, buses)) });
}));

router.get("/:id", requireAuth(), asyncHandler(async (req, res) => {
  const c = collection("complaints").find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ message: "Complaint not found" });
  if (!canView(req, c)) {
    return res.status(403).json({ message: "Not allowed to view this complaint" });
  }
  res.json({ complaint: withStudentInfo(c, collection("users"), collection("buses")) });
}));

router.post("/", requireAuth(), asyncHandler(async (req, res) => {
  const { category, description, busId, routeNumber, imageUrl } = req.body;
  if (!category || !description || !COMPLAINT_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: "A valid complaint category is required" });
  }
  if (String(description).trim().length < 5) {
    return res.status(400).json({ message: "Description must be at least 5 characters" });
  }
  const users = collection("users");
  const user = users.find((u) => u.id === req.auth.sub) || { name: req.auth.name };
  const complaint = {
    id: await nextId("cmp"),
    userId: req.auth.sub,
    name: user.name || req.auth.name,
    role: req.auth.role,
    category,
    busId: busId || null,
    routeNumber: routeNumber ? Number(routeNumber) : null,
    description: String(description).trim(),
    imageUrl: imageUrl || null,
    status: "pending",
    adminResponse: "",
    history: [{ status: "pending", at: Date.now(), by: req.auth.sub }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  collection("complaints").unshift(complaint);
  // notify all admins
  const admins = collection("users").filter((u) => u.role === "admin");
  for (const a of admins) {
    collection("notifications").unshift({
      id: await nextId("ntf"),
      userId: a.id,
      title: "New complaint",
      body: `${complaint.name} raised a ${complaint.category} complaint (${complaint.routeNumber ? "Route " + complaint.routeNumber : "no route"})`,
      type: "complaint",
      read: false,
      createdAt: Date.now(),
    });
  }
  save();
  res.status(201).json({ complaint });
}));

router.put("/:id/status", requireAuth(), asyncHandler(async (req, res) => {
  const c = collection("complaints").find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ message: "Complaint not found" });
  if (!canManage(req, c)) {
    return res.status(403).json({ message: "You are not allowed to update this complaint" });
  }
  const { status, response } = req.body;
  if (!COMPLAINT_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  c.status = status;
  if (response !== undefined) c.adminResponse = String(response).trim();
  c.updatedAt = Date.now();
  c.history.push({ status, at: c.updatedAt, by: req.auth.sub });
  // notify complaint owner
  collection("notifications").unshift({
    id: await nextId("ntf"),
    userId: c.userId,
    title: `Complaint ${status.replace("_", " ")}`,
    body: `Your ${c.category} complaint is now ${status.replace("_", " ")}${c.adminResponse ? `. ${c.adminResponse}` : ""}`,
    type: "complaint",
    read: false,
    createdAt: Date.now(),
  });
  // escalated complaints are routed to the transport department
  if (status === "escalated") {
    const admins = collection("users").filter((u) => u.role === "admin");
    for (const a of admins) {
      collection("notifications").unshift({
        id: await nextId("ntf"),
        userId: a.id,
        title: "Complaint escalated",
        body: `${c.name} escalated a ${c.category} complaint (Route ${c.routeNumber ?? "—"}) to the transport department.`,
        type: "complaint",
        read: false,
        createdAt: Date.now(),
      });
    }
  }
  save();
  res.json({ complaint: withStudentInfo(c, collection("users"), collection("buses")) });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const list = collection("complaints");
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Complaint not found" });
  list.splice(idx, 1);
  save();
  res.json({ message: "Complaint deleted" });
}));

export default router;