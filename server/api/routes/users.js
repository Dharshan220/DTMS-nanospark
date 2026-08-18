import { Router } from "express";
import bcrypt from "bcryptjs";
import { collection, save, nextId, paginate } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler, publicUser } from "../middleware.js";

const router = Router();

const ROLE_LABELS = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  admin: "Super Admin",
};

/** Roles an admin may assign through the panel (admin role is never assignable). */
const ASSIGNABLE_ROLES = ["student", "teacher", "parent"];

/**
 * Students of a faculty member's assigned route.
 * Teachers may only read the student list scoped to their route.
 */
router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const { role, search, page, limit } = req.query;
  let list = collection("users").filter((u) => u.role !== "admin");
  if (req.auth.role === "teacher") {
    const teacher = collection("users").find((u) => u.id === req.auth.sub);
    const routeNumber = teacher ? teacher.routeNumber : null;
    list = list.filter((u) => u.role === "student" && routeNumber != null && u.routeNumber === routeNumber);
  } else if (role && ROLE_LABELS[role]) {
    list = list.filter((u) => u.role === role);
  } else if (req.auth.role === "admin") {
    list = collection("users").filter((u) => u.role !== "admin");
  } else {
    list = [];
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").includes(q) ||
        (u.rollNo || "").toLowerCase().includes(q)
    );
  }
  list = list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  const result = paginate(list, page, limit);
  res.json({ ...result, items: result.items.map(publicUser) });
}));

router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { role, name, email, phone, password, department, year, section, rollNo, routeNumber, boardingStop, gender, childIds, isBusAdmin } = req.body;
  if (!["student", "teacher", "parent"].includes(role)) {
    return res.status(400).json({ message: "Role must be student, teacher or parent" });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  const users = collection("users");
  if (users.some((u) => (u.email || "").toLowerCase() === String(email).toLowerCase())) {
    return res.status(400).json({ message: "Email already registered" });
  }
  const user = {
    id: await nextId("user"),
    role,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone) : null,
    passwordHash: bcrypt.hashSync(String(password), 10),
    department: department || null,
    year: year || null,
    section: section || null,
    rollNo: rollNo || null,
    routeNumber: routeNumber ? Number(routeNumber) : null,
    boardingStop: boardingStop || null,
    gender: gender || null,
    childIds: role === "parent" ? childIds || [] : [],
    isBusAdmin: role === "student" ? Boolean(isBusAdmin) : false,
    active: true,
    createdAt: Date.now(),
  };
  users.push(user);
  save();
  res.status(201).json({ user: publicUser(user) });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const { name, email, phone, department, year, section, rollNo, routeNumber, boardingStop, gender, childIds, isBusAdmin, active, role } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (email !== undefined) user.email = String(email).trim().toLowerCase();
  if (phone !== undefined) user.phone = phone ? String(phone) : null;
  if (department !== undefined) user.department = department;
  if (year !== undefined) user.year = year;
  if (section !== undefined) user.section = section;
  if (rollNo !== undefined) user.rollNo = rollNo;
  if (routeNumber !== undefined) user.routeNumber = routeNumber ? Number(routeNumber) : null;
  if (boardingStop !== undefined) user.boardingStop = boardingStop;
  if (gender !== undefined) user.gender = gender || null;
  if (childIds !== undefined) user.childIds = childIds || [];
  if (isBusAdmin !== undefined && user.role === "student") user.isBusAdmin = Boolean(isBusAdmin);
  if (active !== undefined) user.active = Boolean(active);
  // admins may reassign non-admin roles, but never create/change admin accounts
  if (role !== undefined && user.role !== "admin") {
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role cannot be assigned through the panel" });
    }
    user.role = role;
  }
  save();
  res.json({ user: publicUser(user) });
}));

/**
 * Admin/faculty-only: update a student's transport profile after their
 * first-time setup locked it. Teachers may only edit students on their own route.
 */
router.put("/:id/transport", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "student") {
    return res.status(400).json({ message: "Transport profile is only available for students" });
  }
  if (req.auth.role === "teacher") {
    const teacher = users.find((t) => t.id === req.auth.sub);
    const teacherRoute = teacher ? teacher.routeNumber : null;
    if (teacherRoute == null || user.routeNumber !== teacherRoute) {
      return res.status(403).json({ message: "You can only update students on your assigned route" });
    }
  } else if (req.auth.role !== "admin") {
    return res.status(403).json({ message: "Only admin or faculty can update student transport profiles" });
  }
  const { name, phone, rollNo, department, year, section, routeNumber, boardingStop } = req.body;
  if (name !== undefined && req.auth.role === "admin") user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim() || null;
  if (rollNo !== undefined) user.rollNo = String(rollNo).trim() || null;
  if (department !== undefined) user.department = department || null;
  if (year !== undefined) user.year = year || null;
  if (section !== undefined) user.section = section || null;
  if (routeNumber !== undefined && routeNumber !== "" && routeNumber != null) user.routeNumber = Number(routeNumber);
  if (boardingStop !== undefined && String(boardingStop).trim()) user.boardingStop = String(boardingStop).trim();
  save();
  res.json({ user: publicUser(user) });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });
  const [user] = users.splice(idx, 1);
  // clean up role-specific references
  if (user.role === "student") {
    const buses = collection("buses");
    for (const b of buses) {
      b.busAdminIds = (b.busAdminIds || []).filter((id) => id !== user.id);
    }
  }
  save();
  res.json({ message: "User deleted" });
}));

export default router;