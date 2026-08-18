/**
 * Shared Express middleware + helpers.
 */
import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "dtms-dev-secret-change-me";
export const JWT_EXPIRES_IN = "30d";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function requireAuth(roles = null) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.auth = payload;
      if (roles && !roles.includes(payload.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

export function requireAdmin(roles = ["admin"]) {
  return requireAuth(roles);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    email: u.email,
    phone: u.phone,
    department: u.department,
    year: u.year,
    section: u.section,
    rollNo: u.rollNo,
    routeNumber: u.routeNumber,
    boardingStop: u.boardingStop,
    gender: u.gender || null,
    isBusAdmin: u.isBusAdmin,
    childIds: u.childIds || [],
    photoUrl: u.photoUrl || null,
    active: u.active,
    createdAt: u.createdAt,
  };
}