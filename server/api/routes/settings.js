import { Router } from "express";
import { collection, save } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";
import { COMPLAINT_CATEGORIES } from "./complaints.js";

const router = Router();

export const DEFAULT_SETTINGS = {
  transportName: "DACE Transport",
  academicYear: "2026-2027",
  complaintCategories: COMPLAINT_CATEGORIES,
  emergencyCategories: ["accident", "breakdown", "medical", "safety", "other"],
  busStatusTypes: ["active", "maintenance", "inactive"],
  notificationPreferences: {
    newComplaint: true,
    emergencyAlert: true,
    busDelay: true,
  },
};

function currentSettings() {
  const settings = collection("settings");
  if (settings.length === 0) {
    settings.push({ id: "settings-1", ...DEFAULT_SETTINGS, updatedAt: Date.now() });
    save();
  }
  return settings[0];
}

router.get("/", requireAuth(), asyncHandler(async (_req, res) => {
  const s = currentSettings();
  res.json({
    transportName: s.transportName,
    academicYear: s.academicYear,
    complaintCategories: s.complaintCategories,
    emergencyCategories: s.emergencyCategories,
    busStatusTypes: s.busStatusTypes,
    notificationPreferences: s.notificationPreferences,
  });
}));

router.put("/", requireAdmin(), asyncHandler(async (req, res) => {
  const s = currentSettings();
  const { transportName, academicYear, complaintCategories, emergencyCategories, busStatusTypes, notificationPreferences } = req.body;
  if (transportName !== undefined) s.transportName = String(transportName).trim() || DEFAULT_SETTINGS.transportName;
  if (academicYear !== undefined) s.academicYear = String(academicYear).trim();
  if (Array.isArray(complaintCategories) && complaintCategories.length > 0) {
    s.complaintCategories = complaintCategories.map(String).filter(Boolean);
  }
  if (Array.isArray(emergencyCategories) && emergencyCategories.length > 0) {
    s.emergencyCategories = emergencyCategories.map(String).filter(Boolean);
  }
  if (Array.isArray(busStatusTypes) && busStatusTypes.length > 0) {
    s.busStatusTypes = busStatusTypes.map(String).filter(Boolean);
  }
  if (notificationPreferences && typeof notificationPreferences === "object") {
    s.notificationPreferences = { ...s.notificationPreferences, ...notificationPreferences };
  }
  s.updatedAt = Date.now();
  save();
  res.json({ settings: s });
}));

export default router;