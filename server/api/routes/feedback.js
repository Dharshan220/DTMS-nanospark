import { Router } from "express";
import { collection, save } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

export const FEEDBACK_CATEGORIES = [
  "General",
  "Issue / Complaint",
  "Driver Behavior",
  "Timing",
  "Safety",
  "Suggestion",
];

router.get("/categories", requireAuth(), (_req, res) =>
  res.json({ categories: FEEDBACK_CATEGORIES, years: ["1", "2", "3", "4"] })
);

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  let list = collection("feedback");
  if (req.auth.role !== "admin") {
    list = list.filter((f) => f.userId === req.auth.sub);
  }
  res.json({ items: list, total: list.length });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const list = collection("feedback");
  const idx = list.findIndex((f) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Feedback not found" });
  list.splice(idx, 1);
  save();
  res.json({ message: "Feedback deleted" });
}));

export default router;