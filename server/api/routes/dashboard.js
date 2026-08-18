import { Router } from "express";
import { collection } from "../db.js";
import { requireAuth, requireAdmin, asyncHandler } from "../middleware.js";

const router = Router();

router.get("/", requireAuth(), asyncHandler(async (req, res) => {
  const users = collection("users");
  const buses = collection("buses");
  const routes = collection("routes");
  const complaints = collection("complaints");
  const feedback = collection("feedback");
  const notifications = collection("notifications");
  const attendance = collection("attendance");
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  const role = req.auth.role;

  if (role === "admin") {
    const me = users.find((u) => u.id === req.auth.sub) || {};
    const activeTrips = buses.filter((b) => b.status === "active").length;
    const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
    const todayCounts = collection("passengerCounts").filter((c) => c.date === today);
    const emergencies = collection("emergencies");
    const drivers = collection("drivers");
    const maintenance = collection("maintenance");
    res.json({
      role,
      stats: {
        totalStudents: users.filter((u) => u.role === "student").length,
        totalTeachers: users.filter((u) => u.role === "teacher").length,
        totalParents: users.filter((u) => u.role === "parent").length,
        totalBuses: buses.length,
        activeBuses: buses.filter((b) => b.status === "active").length,
        maintenanceBuses: buses.filter((b) => b.status === "maintenance").length,
        inactiveBuses: buses.filter((b) => b.status === "inactive").length,
        totalDrivers: drivers.length,
        activeTrips,
        liveBuses: buses.filter((b) => b.status === "active").length,
        complaints: complaints.length,
        pendingComplaints,
        inProgressComplaints: complaints.filter((c) => c.status === "in_progress").length,
        resolvedComplaints: complaints.filter((c) => c.status === "resolved").length,
        escalatedComplaints: complaints.filter((c) => c.status === "escalated").length,
        feedback: feedback.length,
        todayPresent: attendance.filter((a) => a.date === today).length,
        activeEmergencies: emergencies.filter((e) => e.status === "active" || e.status === "acknowledged").length,
        maintenanceRecords: maintenance.length,
      },
      todayPassenger: {
        total: todayCounts.reduce((s, c) => s + c.total, 0),
        boys: todayCounts.reduce((s, c) => s + c.boys, 0),
        girls: todayCounts.reduce((s, c) => s + c.girls, 0),
        morning: todayCounts.filter((c) => c.tripType === "morning").reduce((s, c) => s + c.total, 0),
        evening: todayCounts.filter((c) => c.tripType === "evening").reduce((s, c) => s + c.total, 0),
      },
      recentComplaints: complaints.slice(0, 5).map((c) => ({
        id: c.id,
        category: c.category,
        status: c.status,
        name: c.name,
        createdAt: c.createdAt,
        routeNumber: c.routeNumber,
      })),
      recentFeedback: feedback.slice(0, 5),
      activeEmergencies: emergencies
        .filter((e) => e.status === "active" || e.status === "acknowledged")
        .slice(0, 5),
      buses: buses.map((b) => ({
        id: b.id,
        routeNumber: b.routeNumber,
        vehicleNumber: b.vehicleNumber,
        status: b.status,
        driverName: b.driverName,
        driverId: b.driverId || null,
        busAdminCount: (b.busAdminIds || []).length,
      })),
      adminName: me.name || "Super Admin",
      unread: notifications.filter((n) => n.userId === req.auth.sub && !n.read).length,
    });
    return;
  }

  const me = users.find((u) => u.id === req.auth.sub);
  const myRoute = me && me.routeNumber ? routes.find((r) => r.routeNumber === me.routeNumber) : null;
  const myBus = me && me.routeNumber ? buses.find((b) => b.routeNumber === me.routeNumber) : null;
  const myComplaints = complaints.filter((c) => c.userId === req.auth.sub);
  const unread = notifications.filter((n) => n.userId === req.auth.sub && !n.read).length;

  const base = {
    role,
    user: me ? {
      id: me.id,
      name: me.name,
      email: me.email,
      phone: me.phone,
      role: me.role,
      department: me.department,
      year: me.year,
      section: me.section,
      routeNumber: me.routeNumber,
      boardingStop: me.boardingStop,
      isBusAdmin: me.isBusAdmin,
      childIds: me.childIds || [],
      photoUrl: me.photoUrl || null,
    } : null,
    myBus: myBus ? {
      id: myBus.id,
      routeNumber: myBus.routeNumber,
      vehicleNumber: myBus.vehicleNumber,
      driverName: myBus.driverName,
      driverPhone: myBus.driverPhone,
      status: myBus.status,
    } : null,
    route: myRoute
      ? {
          routeNumber: myRoute.routeNumber,
          arrivalTime: myRoute.arrivalTime,
          stops: (myRoute.stops || []).map((s) => ({ name: s.name, time: s.time })),
        }
      : null,
    complaints: {
      total: myComplaints.length,
      pending: myComplaints.filter((c) => c.status === "pending").length,
      inProgress: myComplaints.filter((c) => c.status === "in_progress").length,
      resolved: myComplaints.filter((c) => c.status === "resolved").length,
    },
    unread,
  };

  if (role === "student") {
    const todayAtt = attendance.find((a) => a.studentId === req.auth.sub && a.date === today);
    base.attendance = {
      today: todayAtt ? todayAtt.status : "not_checked",
      presentCount: attendance.filter((a) => a.studentId === req.auth.sub && a.status === "present").length,
    };
    base.isBusAdmin = Boolean(me && me.isBusAdmin);
  }

  if (role === "parent") {
    const childIds = me ? me.childIds || [] : [];
    const kids = users.filter((u) => childIds.includes(u.id));
    base.children = kids.map((k) => ({
      id: k.id,
      name: k.name,
      department: k.department,
      year: k.year,
      section: k.section,
      routeNumber: k.routeNumber,
      boardingStop: k.boardingStop,
    }));
  }

  res.json(base);
}));

export default router;