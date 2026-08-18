import { Router } from "express";
import { collection } from "../db.js";
import { requireAuth, asyncHandler } from "../middleware.js";

const router = Router();

/**
 * Simulated live bus positions.
 * Each active bus moves along its route path toward college and loops.
 */
const sim = new Map();

function ensureSimState(route) {
  if (sim.has(route.id)) return sim.get(route.id);
  const state = {
    segment: 0,
    t: 0.3 + Math.random() * 0.4,
    speed: 28 + Math.random() * 22,
    updatedAt: Date.now(),
  };
  sim.set(route.id, state);
  return state;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function computePosition(route, state, elapsedMs) {
  const path = route.path && route.path.length >= 2 ? route.path : route.boardingPoints;
  const segments = path.length - 1;
  const progressPerSec = (state.speed / 1000) / 40000; // speed (km/h) → fraction of whole path per ms
  let t = state.t + (elapsedMs / 1000) * progressPerSec * 2.2;
  while (t >= 1) t -= 1;
  state.t = t;
  const total = segments;
  const pos = t * total;
  const seg = Math.min(segments - 1, Math.floor(pos));
  const f = pos - seg;
  const a = path[seg];
  const b = path[seg + 1];
  const lat = lerp(a.lat, b.lat, f);
  const lng = lerp(a.lng, b.lng, f);
  // next stop + ETA
  const stops = route.boardingPoints || [];
  const stopIdx = Math.min(stops.length - 1, seg + 1);
  const nextStop = stops[stopIdx] || stops[stops.length - 1];
  const remaining = (1 - t) * total;
  const etaMinutes = Math.max(1, Math.round(remaining * 6));
  const heading = Math.round((((f * 360) % 360) + 360) % 360);
  return { lat, lng, speedKmh: Math.round(state.speed), heading, nextStop: nextStop.name, etaMinutes, stopTime: nextStop.time };
}

router.get("/buses", requireAuth(), asyncHandler(async (req, res) => {
  const routes = collection("routes").filter((r) => r.active !== false);
  const buses = collection("buses").filter((b) => b.status !== "maintenance");
  const now = Date.now();
  const items = buses.map((bus) => {
    const route = routes.find((r) => r.routeNumber === bus.routeNumber) || routes[0];
    if (!route) return null;
    const state = ensureSimState(route);
    const pos = computePosition(route, state, now - state.updatedAt);
    state.updatedAt = now;
    return {
      busId: bus.id,
      routeNumber: bus.routeNumber,
      vehicleNumber: bus.vehicleNumber,
      driverName: bus.driverName,
      driverPhone: bus.driverPhone,
      ...pos,
    };
  }).filter(Boolean);
  res.json({ items, updatedAt: now });
}));

router.get("/route/:routeNumber", requireAuth(), asyncHandler(async (req, res) => {
  const route = collection("routes").find((r) => String(r.routeNumber) === String(req.params.routeNumber));
  if (!route) return res.status(404).json({ message: "Route not found" });
  const state = ensureSimState(route);
  const pos = computePosition(route, state, Date.now() - state.updatedAt);
  state.updatedAt = Date.now();
  res.json({
    route,
    current: pos,
    path: route.path || [],
    stops: route.boardingPoints || [],
  });
}));

router.get("/my", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.auth.sub);
  if (!user || !user.routeNumber) return res.status(404).json({ message: "No bus assigned to your profile" });
  const routes = collection("routes");
  const route = routes.find((r) => r.routeNumber === user.routeNumber);
  if (!route) return res.status(404).json({ message: "Assigned route not found" });
  const state = ensureSimState(route);
  const pos = computePosition(route, state, Date.now() - state.updatedAt);
  state.updatedAt = Date.now();
  res.json({ route, current: pos });
}));

export default router;