import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  let list = collection("notifications").filter((n) => n.userId === req.auth.sub);
  list = list.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  res.json({ items: list, unread: list.filter((n) => !n.read).length });
}));

router.put("/:id/read", requireAuth(), asyncHandler(async (req, res) => {
  const n = collection("notifications").find((x) => x.id === req.params.id && x.userId === req.auth.sub);
  if (!n) return res.status(404).json({ message: "Notification not found" });
  n.read = true;
  save();
  res.json({ notification: n });
}));

router.put("/read-all", requireAuth(), asyncHandler(async (req, res) => {
  for (const n of collection("notifications")) {
    if (n.userId === req.auth.sub) n.read = true;
  }
  save();
  res.json({ message: "All notifications marked read" });
}));

/**
 * Broadcast a notification to roles, a specific bus, a specific route,
 * or everyone (when no target is given).
 */
router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { title, body, roles, type, busId, routeNumber } = req.body;
  if (!title || !body) return res.status(400).json({ message: "Title and body are required" });
  const users = collection("users");
  let targets = users;
  if (busId) {
    const bus = collection("buses").find((b) => b.id === busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    targets = users.filter((u) => u.routeNumber === bus.routeNumber);
  } else if (routeNumber !== undefined && routeNumber !== null && routeNumber !== "") {
    targets = users.filter((u) => u.routeNumber === Number(routeNumber));
  } else if (roles && roles.length > 0) {
    targets = users.filter((u) => roles.includes(u.role));
  }
  const now = Date.now();
  const created = [];
  for (const t of targets) {
    const notification = {
      id: await nextId("ntf"),
      userId: t.id,
      title: String(title),
      body: String(body),
      type: type || "broadcast",
      read: false,
      createdAt: now,
    };
    collection("notifications").unshift(notification);
    created.push(notification);
  }
  save();
  res.status(201).json({ message: `Sent to ${created.length} users`, count: created.length });
}));

router.delete("/:id", requireAuth(), asyncHandler(async (req, res) => {
  const list = collection("notifications");
  const idx = list.findIndex((x) => x.id === req.params.id && x.userId === req.auth.sub);
  if (idx === -1) return res.status(404).json({ message: "Notification not found" });
  list.splice(idx, 1);
  save();
  res.json({ message: "Notification deleted" });
}));

// Register FCM token for push notifications
router.post("/devices/fcm", requireAuth(), asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "token is required" });
  const devices = collection("devices");
  const existing = devices.find((d) => d.userId === req.auth.sub && d.fcmToken === token);
  if (!existing) {
    devices.push({ userId: req.auth.sub, fcmToken: String(token), platform: "android", lastSeen: Date.now() });
    save();
  }
  res.json({ message: "Device registered" });
}));

export default router;