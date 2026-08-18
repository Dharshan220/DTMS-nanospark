import { Router } from "express";
import bcrypt from "bcryptjs";
import { collection, save, nextId } from "../db.js";
import { signToken, requireAuth, asyncHandler, publicUser } from "../middleware.js";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { role, identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const users = collection("users");
    const user = users.find(
      (u) =>
        (u.email || "").toLowerCase() === String(identifier).toLowerCase() ||
        (u.phone || "") === String(identifier)
    );
    if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.role !== role) {
      return res.status(403).json({ message: `This account is not registered as ${role}` });
    }
    if (user.active === false) {
      return res.status(403).json({ message: "Account disabled. Contact transport office." });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

router.get("/me", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.auth.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
}));

router.put("/profile", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.auth.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  const { name, phone, photoUrl, rollNo, department, year, section, routeNumber, boardingStop } = req.body;

  // Students may fill their transport profile only while it is incomplete
  // (first-time setup). Once every required field is set, the profile is
  // locked and only an admin/faculty can update it (PUT /users/:id/transport).
  if (user.role === "student") {
    const required = ["name", "rollNo", "phone", "routeNumber", "boardingStop"];
    const complete = required.every(
      (field) => user[field] != null && String(user[field]).trim() !== ""
    );
    if (complete) {
      const locked = ["name", "rollNo", "phone", "routeNumber", "boardingStop"];
      if (locked.some((field) => req.body[field] !== undefined)) {
        return res.status(400).json({
          message:
            "Your transport profile is locked after first-time setup. Contact the transport office (admin/faculty) to update it.",
        });
      }
    }
  }

  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim() || null;
  if (photoUrl !== undefined) user.photoUrl = photoUrl;
  if (rollNo !== undefined) user.rollNo = String(rollNo).trim() || null;
  if (department !== undefined) user.department = department || null;
  if (year !== undefined) user.year = year || null;
  if (section !== undefined) user.section = section || null;
  if (routeNumber !== undefined && routeNumber !== "" && routeNumber != null) user.routeNumber = Number(routeNumber);
  if (boardingStop !== undefined && String(boardingStop).trim()) user.boardingStop = String(boardingStop).trim();
  save();
  res.json({ user: publicUser(user) });
}));

router.post("/change-password", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const user = users.find((u) => u.id === req.auth.sub);
  const { currentPassword, newPassword } = req.body;
  if (!user || !bcrypt.compareSync(String(currentPassword || ""), user.passwordHash)) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }
  user.passwordHash = bcrypt.hashSync(String(newPassword), 10);
  save();
  res.json({ message: "Password updated" });
}));

// Legacy admin login kept for the web app
router.post("/admin-login", asyncHandler(async (req, res) => {
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
    const user = { id: `legacy-${username}`, role: "admin", name: username };
    res.json({ message: "Login successful", username, token: signToken(user) });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
}));

export default router;