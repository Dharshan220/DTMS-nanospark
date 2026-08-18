import { Router } from "express";
import { collection, save, nextId } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const routes = collection("routes").filter((r) => r.active !== false);
  res.json({ items: routes, total: routes.length });
}));

router.get("/:routeNumber", requireAuth(), asyncHandler(async (req, res) => {
  const route = collection("routes").find((r) => String(r.routeNumber) === String(req.params.routeNumber));
  if (!route) return res.status(404).json({ message: "Route not found" });
  res.json({ route });
}));

router.post("/", requireAdmin(), asyncHandler(async (req, res) => {
  const { routeNumber, vehicleNumber, driverName, driverPhone, arrivalTime, boardingPoints } = req.body;
  if (!routeNumber || !Array.isArray(boardingPoints) || boardingPoints.length === 0) {
    return res.status(400).json({ message: "routeNumber and boardingPoints are required" });
  }
  const route = {
    id: await nextId("route"),
    routeNumber: Number(routeNumber),
    vehicleNumber: vehicleNumber || "",
    driverName: driverName || "",
    driverPhone: driverPhone || "",
    arrivalTime: arrivalTime || "8:05 AM",
    boardingPoints: boardingPoints.map((p) => ({ name: String(p.name), time: String(p.time) })),
    stops: boardingPoints.map((p) => ({ name: String(p.name), time: String(p.time) })),
    path: [],
    active: true,
    createdAt: Date.now(),
  };
  collection("routes").push(route);
  save();
  res.status(201).json({ route });
}));

router.put("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const route = collection("routes").find((r) => r.id === req.params.id);
  if (!route) return res.status(404).json({ message: "Route not found" });
  const { routeNumber, vehicleNumber, driverName, driverPhone, arrivalTime, boardingPoints, active } = req.body;
  if (routeNumber !== undefined) route.routeNumber = Number(routeNumber);
  if (vehicleNumber !== undefined) route.vehicleNumber = vehicleNumber;
  if (driverName !== undefined) route.driverName = driverName;
  if (driverPhone !== undefined) route.driverPhone = driverPhone;
  if (arrivalTime !== undefined) route.arrivalTime = arrivalTime;
  if (boardingPoints !== undefined) {
    route.boardingPoints = boardingPoints.map((p) => ({ name: String(p.name), time: String(p.time) }));
    route.stops = route.boardingPoints;
  }
  if (active !== undefined) route.active = Boolean(active);
  save();
  res.json({ route });
}));

router.delete("/:id", requireAdmin(), asyncHandler(async (req, res) => {
  const routes = collection("routes");
  const idx = routes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Route not found" });
  routes.splice(idx, 1);
  save();
  res.json({ message: "Route deleted" });
}));

export default router;