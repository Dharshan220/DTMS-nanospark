import { Router } from "express";
import { collection } from "../db.js";
import { requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.use(requireAdmin());

function byStatus(list, status) {
  return list.filter((x) => x.status === status).length;
}

router.get("/summary", asyncHandler(async (_req, res) => {
  const users = collection("users");
  const complaints = collection("complaints");
  const feedback = collection("feedback");
  const attendance = collection("attendance");
  res.json({
    totals: {
      students: users.filter((u) => u.role === "student").length,
      teachers: users.filter((u) => u.role === "teacher").length,
      parents: users.filter((u) => u.role === "parent").length,
      complaints: complaints.length,
      feedback: feedback.length,
    },
    complaintsByStatus: {
      pending: byStatus(complaints, "pending"),
      in_progress: byStatus(complaints, "in_progress"),
      resolved: byStatus(complaints, "resolved"),
    },
    complaintsByCategory: complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {}),
    attendanceRate: attendance.length
      ? Math.round((attendance.filter((a) => a.status === "present").length / attendance.length) * 100)
      : 0,
  });
}));

router.get("/complaints", asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  let list = collection("complaints");
  if (status) list = list.filter((c) => c.status === status);
  if (from) list = list.filter((c) => c.createdAt >= Number(from));
  if (to) list = list.filter((c) => c.createdAt <= Number(to));
  res.json({ items: list, total: list.length });
}));

router.get("/feedback", asyncHandler(async (_req, res) => {
  const list = collection("feedback");
  res.json({ items: list, total: list.length });
}));

router.get("/attendance", asyncHandler(async (req, res) => {
  const { month } = req.query;
  let list = collection("attendance");
  if (month) list = list.filter((a) => a.date.startsWith(String(month)));
  const byDay = {};
  for (const a of list) {
    if (!byDay[a.date]) byDay[a.date] = { present: 0, absent: 0 };
    byDay[a.date][a.status] += 1;
  }
  res.json({ byDay, total: list.length });
}));

export default router;