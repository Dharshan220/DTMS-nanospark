import { Router } from "express";
import { collection } from "../db.js";
import { requireAuth, asyncHandler } from "../middleware.js";

const router = Router();

/**
 * Student bus pass — payload the QR code encodes.
 */
router.get("/pass", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const targetId = req.query.userId && req.auth.role === "admin" ? req.query.userId : req.auth.sub;
  const user = users.find((u) => u.id === targetId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const buses = collection("buses");
  const bus = user.routeNumber ? buses.find((b) => b.routeNumber === user.routeNumber) : null;
  const validTill = new Date();
  validTill.setMonth(validTill.getMonth() + 6);
  const pass = {
    type: "DTMS_BUS_PASS",
    v: 1,
    studentId: user.rollNo || user.id,
    name: user.name,
    department: user.department || "",
    year: user.year || "",
    section: user.section || "",
    routeNumber: user.routeNumber || null,
    vehicleNumber: bus ? bus.vehicleNumber : null,
    boardingStop: user.boardingStop || "",
    validTill: validTill.toISOString().slice(0, 10),
    issuedAt: new Date().toISOString(),
  };
  const payload = Buffer.from(JSON.stringify(pass)).toString("base64url");
  res.json({ pass, qrPayload: `DTMS|${payload}` });
}));

export default router;