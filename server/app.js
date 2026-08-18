import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createDb, collection, save, flush } from "./api/db.js";
import { buildSeed } from "./api/seed.js";

import authRoutes from "./api/routes/auth.js";
import userRoutes from "./api/routes/users.js";
import busRoutes from "./api/routes/buses.js";
import transportRoutes from "./api/routes/transport.js";
import complaintRoutes from "./api/routes/complaints.js";
import feedbackRoutes from "./api/routes/feedback.js";
import notificationRoutes from "./api/routes/notifications.js";
import attendanceRoutes from "./api/routes/attendance.js";
import trackingRoutes from "./api/routes/tracking.js";
import dashboardRoutes from "./api/routes/dashboard.js";
import reportRoutes from "./api/routes/reports.js";
import qrRoutes from "./api/routes/qr.js";
import driverRoutes from "./api/routes/drivers.js";
import emergencyRoutes from "./api/routes/emergencies.js";
import maintenanceRoutes from "./api/routes/maintenance.js";
import settingsRoutes from "./api/routes/settings.js";
import { requireAuth } from "./api/middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const uploadDir = path.join(__dirname, "uploads");

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image uploads are allowed."));
    cb(null, true);
  },
});

// ---- Public feedback endpoints (web app compatibility + app) ----
app.get("/api/feedback", async (_req, res) => {
  const items = collection("feedback");
  res.json(items);
});

app.post("/api/feedback", upload.single("image"), async (req, res) => {
  const { name = "Anonymous", department, year, section, routeNumber = "", category, description, userId } = req.body;
  if (!department || !year || !section || !category || !description) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const entry = {
    id: Date.now(),
    userId: userId || null,
    name: String(name).trim() || "Anonymous",
    department: String(department).trim(),
    year: String(year),
    section: String(section).trim(),
    routeNumber: String(routeNumber),
    category: String(category),
    description: String(description).trim(),
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    imageName: req.file ? req.file.originalname : null,
    timestamp: new Date().toISOString(),
  };
  const items = collection("feedback");
  items.unshift(entry);
  save();
  res.status(201).json(entry);
});

// ---- Legacy admin login (web app compatibility) ----
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const admins = {
    admin1: "password123",
    admin2: "securepass456",
    admin3: "adminpass789",
    superadmin: "superpassword1",
    masteradmin: "masterpassword2",
  };
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  if (admins[username] && admins[username] === password) {
    return res.status(200).json({ message: "Login successful", username });
  }
  res.status(401).json({ message: "Invalid username or password" });
});

// ---- DTMS App API ----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routes", transportRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/feedback-data", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/settings", settingsRoutes);

// File upload for complaints (image field)
app.post("/api/upload/image", requireAuth(), upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  res.json({ imageUrl: `/uploads/${req.file.filename}`, imageName: req.file.originalname });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image too large. Max 2 MB." });
  }
  res.status(400).json({ message: err.message || "Upload error." });
});

// 404 for unknown /api
app.use("/api", (_req, res) => res.status(404).json({ message: "API endpoint not found" }));

export async function startServer() {
  await fs.mkdir(uploadDir, { recursive: true });
  await createDb(buildSeed);
  return app;
}