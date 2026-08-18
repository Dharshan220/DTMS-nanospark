/**
 * Seed data for a fresh DTMS database.
 */
import bcrypt from "bcryptjs";
import { allRoutes } from "./routes-seed.js";

export function buildSeed() {
  const now = Date.now();
  const routes = allRoutes();
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  const today = new Date(now).toISOString().slice(0, 10);

  const buses = routes.map((r, i) => ({
    id: `bus-${r.routeNumber}`,
    routeNumber: r.routeNumber,
    vehicleNumber: r.vehicleNumber,
    driverName: r.driverName,
    driverPhone: r.driverPhone,
    capacity: 60,
    status: i === 6 ? "maintenance" : "active",
    busAdminIds: [],
    createdAt: now,
  }));

  const student = (id, name, email, dept, year, section, rollNo, routeNumber, boardingStop, gender = null) => ({
    id,
    role: "student",
    name,
    email,
    phone: null,
    passwordHash: bcrypt.hashSync("student123", 10),
    department: dept,
    year: String(year),
    section,
    rollNo,
    routeNumber,
    boardingStop,
    gender,
    childIds: [],
    isBusAdmin: false,
    active: true,
    createdAt: now,
  });

  const users = [
    {
      id: "user-admin",
      role: "admin",
      name: "Super Admin",
      email: "admin@dtms.in",
      phone: "9962022222",
      passwordHash: bcrypt.hashSync("admin123", 10),
      department: "Transport Department",
      routeNumber: null,
      isBusAdmin: false,
      active: true,
      createdAt: now,
    },
    student("user-student-1", "Dharshan E", "student@dtms.in", "CSE", 3, "A", "21CS101", 21, "PADAPPAI"),
    student("user-student-2", "Priya S", "student2@dtms.in", "ECE", 2, "B", "22EC102", 22, "TAMBARAM MCC"),
    student("user-student-3", "Kavya R", "student3@dtms.in", "CSE", 2, "A", "23CS103", 25, "TAMBARAM", "female"),
    student("user-student-4", "Mohammed Irfan", "student4@dtms.in", "ECE", 3, "B", "21EC104", 25, "PURASAIVAKKAM", "male"),
    student("user-student-5", "Divya Lakshmi", "student5@dtms.in", "IT", 1, "A", "24IT105", 25, "EGMORE (BACK SIDE)", "female"),
    student("user-student-6", "Sanjay V", "student6@dtms.in", "MECH", 4, "A", "20ME106", 25, "SKY WALK", "male"),
    student("user-student-7", "Harini P", "student7@dtms.in", "AIDS", 2, "B", "23AI107", 25, "M.R NAGAR", "female"),
    student("user-student-8", "Vignesh K", "student8@dtms.in", "CIVIL", 3, "A", "21CV108", 25, "PALLAVARAM AMMA HOTEL", "male"),
    student("user-student-9", "Nandhini S", "student9@dtms.in", "EEE", 1, "B", "24EE109", 25, "ARUMBAKKAM MMDA", "female"),
    student("user-student-10", "Arun Prakash", "student10@dtms.in", "AI&DS", 2, "A", "23AD110", 25, "DAS PRAKASH HOTEL", "male"),
    student("user-student-11", "Rithika M", "student11@dtms.in", "CSE", 3, "B", "21CS111", 21, "MUDICHUR"),
    student("user-student-12", "Karthik S", "student12@dtms.in", "ECE", 2, "A", "22EC112", 22, "PALLIKARANAI"),
    student("user-student-13", "Sneha B", "student13@dtms.in", "IT", 4, "B", "20IT113", 23, "PERUNGALATHUR"),
    student("user-student-14", "Deepak N", "student14@dtms.in", "MECH", 1, "A", "24ME114", 26, "CHROMPET"),
    {
      id: "user-teacher-1",
      role: "teacher",
      name: "Dr. Anand Kumar",
      email: "teacher@dtms.in",
      phone: "9865432100",
      passwordHash: bcrypt.hashSync("teacher123", 10),
      department: "Mechanical",
      routeNumber: 25,
      isBusAdmin: false,
      active: true,
      createdAt: now,
    },
    {
      id: "user-parent-1",
      role: "parent",
      name: "Kumar R",
      email: "parent@dtms.in",
      phone: "9798645321",
      passwordHash: bcrypt.hashSync("parent123", 10),
      childIds: ["user-student-1"],
      routeNumber: 21,
      isBusAdmin: false,
      active: true,
      createdAt: now,
    },
  ];

  const complaint = (id, userId, category, routeNumber, description, status, adminResponse, createdAt, history = []) => ({
    id,
    userId,
    name: users.find((u) => u.id === userId)?.name || "Student",
    role: "student",
    category,
    busId: `bus-${routeNumber}`,
    routeNumber,
    description,
    imageUrl: null,
    status,
    adminResponse,
    history: history.length
      ? history
      : [{ status, at: createdAt, by: "user-admin" }],
    createdAt,
    updatedAt: createdAt,
  });

  const complaints = [
    complaint(
      "cmp-1",
      "user-student-1",
      "Bus Delay",
      21,
      "Route 21 bus was 20 minutes late this morning at PADAPPAI stop.",
      "pending",
      "",
      now - 26 * HOUR
    ),
    complaint(
      "cmp-2",
      "user-student-2",
      "Cleanliness",
      22,
      "The bus floor near the rear door is not cleaned regularly.",
      "in_progress",
      "Cleaning schedule updated for this bus.",
      now - 50 * HOUR,
      [
        { status: "pending", at: now - 50 * HOUR, by: "user-student-2" },
        { status: "in_progress", at: now - 20 * HOUR, by: "user-admin" },
      ]
    ),
    complaint(
      "cmp-3",
      "user-teacher-1",
      "Seat Damage",
      25,
      "Two seats near the front have torn upholstery.",
      "resolved",
      "Seats replaced. Thanks for reporting.",
      now - 72 * HOUR,
      [
        { status: "pending", at: now - 72 * HOUR, by: "user-teacher-1" },
        { status: "in_progress", at: now - 60 * HOUR, by: "user-admin" },
        { status: "resolved", at: now - 30 * HOUR, by: "user-admin" },
      ]
    ),
    complaint(
      "cmp-4",
      "user-student-3",
      "Bus Delay",
      25,
      "Route 25 arrived about 15 minutes late at TAMBARAM this morning due to traffic near Chromepet.",
      "pending",
      "",
      now - 5 * HOUR
    ),
    complaint(
      "cmp-5",
      "user-student-4",
      "Vehicle Problem",
      25,
      "The rear AC vent is not working and the step light near the door flickers.",
      "in_progress",
      "AC service scheduled for this bus tomorrow morning.",
      now - 28 * HOUR,
      [
        { status: "pending", at: now - 28 * HOUR, by: "user-student-4" },
        { status: "under_review", at: now - 22 * HOUR, by: "user-teacher-1" },
        { status: "in_progress", at: now - 6 * HOUR, by: "user-admin" },
      ]
    ),
    complaint(
      "cmp-6",
      "user-student-5",
      "Student Safety",
      25,
      "The bus overtook at high speed near the Airport flyover while students were standing.",
      "escalated",
      "Driver counseled; route monitoring increased. Escalated to transport department.",
      now - 52 * HOUR,
      [
        { status: "pending", at: now - 52 * HOUR, by: "user-student-5" },
        { status: "under_review", at: now - 40 * HOUR, by: "user-teacher-1" },
        { status: "escalated", at: now - 12 * HOUR, by: "user-teacher-1" },
      ]
    ),
    complaint(
      "cmp-7",
      "user-student-7",
      "Bus Stop Issue",
      25,
      "There is no shelter at the M.R NAGAR stop and the bus often stops across the road.",
      "under_review",
      "",
      now - 8 * HOUR,
      [
        { status: "pending", at: now - 8 * HOUR, by: "user-student-7" },
        { status: "under_review", at: now - 3 * HOUR, by: "user-teacher-1" },
      ]
    ),
    complaint(
      "cmp-8",
      "user-student-6",
      "Driver Issue",
      25,
      "The driver often skips the SKY WALK stop on busy days.",
      "pending",
      "",
      now - 2 * HOUR
    ),
    complaint(
      "cmp-9",
      "user-student-11",
      "Route Issue",
      21,
      "The MUDICHUR stop timing needs a small correction on the notice board.",
      "pending",
      "",
      now - 30 * HOUR
    ),
  ];

  const notifications = [
    {
      id: "ntf-1",
      userId: "user-student-1",
      title: "Bus Route 21 delayed",
      body: "Route 21 is late by 10 minutes due to traffic near Pallavaram.",
      type: "alert",
      read: false,
      createdAt: now - 2 * HOUR,
    },
    {
      id: "ntf-2",
      userId: "user-student-1",
      title: "Complaint update",
      body: "Your complaint (Bus Delay) status changed to Pending.",
      type: "complaint",
      read: true,
      createdAt: now - 25 * HOUR,
    },
    {
      id: "ntf-3",
      userId: "user-teacher-1",
      title: "Bus Route 25 delayed",
      body: "Route 25 is running about 10 minutes late due to traffic near Chromepet.",
      type: "alert",
      read: false,
      createdAt: now - 45 * 60 * 1000,
    },
    {
      id: "ntf-4",
      userId: "user-teacher-1",
      title: "Complaint update",
      body: "Your complaint (Seat Damage) is now Resolved.",
      type: "complaint",
      read: true,
      createdAt: now - 30 * HOUR,
    },
    {
      id: "ntf-5",
      userId: "user-teacher-1",
      title: "Bus Replacement",
      body: "Route 25 will use a spare bus on Saturday for routine maintenance.",
      type: "broadcast",
      read: false,
      createdAt: now - 20 * HOUR,
    },
    {
      id: "ntf-6",
      userId: "user-teacher-1",
      title: "Transport announcement",
      body: "Timings for all routes are revised by 5 minutes from next Monday.",
      type: "broadcast",
      read: false,
      createdAt: now - 48 * HOUR,
    },
    {
      id: "ntf-7",
      userId: "user-teacher-1",
      title: "Complaint escalated",
      body: "A Student Safety complaint from Route 25 was escalated to the transport department.",
      type: "complaint",
      read: false,
      createdAt: now - 12 * HOUR,
    },
  ];

  const att = (id, studentId, date, stop, status = "present") => ({
    id,
    studentId,
    date,
    busId: `bus-25`,
    routeNumber: 25,
    status,
    checkInAt: `${date}T07:${(30 + Number(id.slice(-1)) * 3) % 60}:00.000Z`,
    checkInStop: stop,
  });

  const attendance = [
    { id: "att-1", studentId: "user-student-1", date: new Date(now - DAY).toISOString().slice(0, 10), busId: "bus-21", routeNumber: 21, status: "present", checkInAt: new Date(now - DAY).toISOString(), checkInStop: "PADAPPAI" },
    { id: "att-2", studentId: "user-student-1", date: new Date(now - 2 * DAY).toISOString().slice(0, 10), busId: "bus-21", routeNumber: 21, status: "present", checkInAt: new Date(now - 2 * DAY).toISOString(), checkInStop: "PADAPPAI" },
    // Route 25 — today
    att("att-25-3", "user-student-3", today, "TAMBARAM"),
    att("att-25-4", "user-student-4", today, "PURASAIVAKKAM"),
    att("att-25-5", "user-student-5", today, "EGMORE (BACK SIDE)"),
    att("att-25-6", "user-student-6", today, "SKY WALK", "absent"),
    att("att-25-7", "user-student-7", today, "M.R NAGAR"),
    att("att-25-8", "user-student-8", today, "PALLAVARAM AMMA HOTEL"),
    att("att-25-9", "user-student-9", today, "ARUMBAKKAM MMDA", "absent"),
    // Route 25 — history
    att("att-25-h1", "user-student-3", new Date(now - DAY).toISOString().slice(0, 10), "TAMBARAM"),
    att("att-25-h2", "user-student-4", new Date(now - DAY).toISOString().slice(0, 10), "PURASAIVAKKAM"),
    att("att-25-h3", "user-student-5", new Date(now - DAY).toISOString().slice(0, 10), "EGMORE (BACK SIDE)", "absent"),
    att("att-25-h4", "user-student-6", new Date(now - DAY).toISOString().slice(0, 10), "SKY WALK"),
    att("att-25-h5", "user-student-7", new Date(now - DAY).toISOString().slice(0, 10), "M.R NAGAR"),
    att("att-25-h6", "user-student-8", new Date(now - DAY).toISOString().slice(0, 10), "PALLAVARAM AMMA HOTEL"),
    att("att-25-h7", "user-student-9", new Date(now - DAY).toISOString().slice(0, 10), "ARUMBAKKAM MMDA"),
    att("att-25-h8", "user-student-10", new Date(now - DAY).toISOString().slice(0, 10), "DAS PRAKASH HOTEL"),
    att("att-25-h9", "user-student-3", new Date(now - 2 * DAY).toISOString().slice(0, 10), "TAMBARAM"),
    att("att-25-h10", "user-student-4", new Date(now - 2 * DAY).toISOString().slice(0, 10), "PURASAIVAKKAM"),
    att("att-25-h11", "user-student-5", new Date(now - 2 * DAY).toISOString().slice(0, 10), "EGMORE (BACK SIDE)"),
    att("att-25-h12", "user-student-6", new Date(now - 2 * DAY).toISOString().slice(0, 10), "SKY WALK"),
    att("att-25-h13", "user-student-7", new Date(now - 2 * DAY).toISOString().slice(0, 10), "M.R NAGAR"),
    att("att-25-h14", "user-student-8", new Date(now - 2 * DAY).toISOString().slice(0, 10), "PALLAVARAM AMMA HOTEL"),
    att("att-25-h15", "user-student-9", new Date(now - 2 * DAY).toISOString().slice(0, 10), "ARUMBAKKAM MMDA", "absent"),
    att("att-25-h16", "user-student-10", new Date(now - 2 * DAY).toISOString().slice(0, 10), "DAS PRAKASH HOTEL"),
  ];

  const d1 = new Date(now - DAY).toISOString().slice(0, 10);
  const d2 = new Date(now - 2 * DAY).toISOString().slice(0, 10);

  const passengerCounts = [
    {
      id: "cnt-1",
      date: today,
      busId: "bus-25",
      routeNumber: 25,
      facultyId: "user-teacher-1",
      tripType: "morning",
      total: 40,
      boys: 23,
      girls: 17,
      createdAt: now - 3 * HOUR,
      updatedAt: now - 3 * HOUR,
    },
    {
      id: "cnt-2",
      date: today,
      busId: "bus-25",
      routeNumber: 25,
      facultyId: "user-teacher-1",
      tripType: "evening",
      total: 38,
      boys: 22,
      girls: 16,
      createdAt: now - HOUR,
      updatedAt: now - HOUR,
    },
    {
      id: "cnt-3",
      date: d1,
      busId: "bus-25",
      routeNumber: 25,
      facultyId: "user-teacher-1",
      tripType: "morning",
      total: 41,
      boys: 24,
      girls: 17,
      createdAt: now - 1 * DAY - HOUR,
      updatedAt: now - 1 * DAY - HOUR,
    },
    {
      id: "cnt-4",
      date: d1,
      busId: "bus-25",
      routeNumber: 25,
      facultyId: "user-teacher-1",
      tripType: "evening",
      total: 36,
      boys: 21,
      girls: 15,
      createdAt: now - 1 * DAY - 2 * HOUR,
      updatedAt: now - 1 * DAY - 2 * HOUR,
    },
    {
      id: "cnt-5",
      date: d2,
      busId: "bus-25",
      routeNumber: 25,
      facultyId: "user-teacher-1",
      tripType: "morning",
      total: 39,
      boys: 22,
      girls: 17,
      createdAt: now - 2 * DAY - HOUR,
      updatedAt: now - 2 * DAY - HOUR,
    },
  ];

  const drivers = [
    {
      id: "driver-1",
      name: "UDHAYAKUMAR B",
      phone: "9940330284",
      licenseNumber: "TN-25-2021-004182",
      licenseExpiry: "2027-03-31",
      experienceYears: 12,
      status: "active",
      assignedBusId: "bus-25",
      createdAt: now,
    },
    {
      id: "driver-2",
      name: "MANIKANDAN T",
      phone: "9176046241",
      licenseNumber: "TN-25-2022-006771",
      licenseExpiry: "2027-08-15",
      experienceYears: 9,
      status: "active",
      assignedBusId: "bus-26",
      createdAt: now,
    },
    {
      id: "driver-3",
      name: "PALANI S",
      phone: "6382206921",
      licenseNumber: "TN-25-2020-001254",
      licenseExpiry: "2026-11-30",
      experienceYears: 15,
      status: "active",
      assignedBusId: "bus-28",
      createdAt: now,
    },
    {
      id: "driver-4",
      name: "RAMU D",
      phone: "7338862194",
      licenseNumber: "TN-19-2023-009318",
      licenseExpiry: "2028-01-20",
      experienceYears: 6,
      status: "on_leave",
      assignedBusId: null,
      createdAt: now,
    },
  ];

  // link drivers to their buses (name/phone are mirrored on the bus)
  for (const d of drivers) {
    const bus = buses.find((b) => b.id === d.assignedBusId);
    if (bus) {
      bus.driverId = d.id;
      bus.driverName = d.name;
      bus.driverPhone = d.phone;
    }
  }

  const emergencies = [
    {
      id: "emg-1",
      type: "breakdown",
      description: "Bus stopped on GST road near Tambaram; engine overheating, coolant leaking.",
      location: "GST Road, Tambaram",
      busId: "bus-25",
      busNumber: "TN 11 F 0076",
      routeNumber: 25,
      reportedById: "user-teacher-1",
      reportedByName: "Dr. Anand Kumar",
      status: "active",
      adminResponse: null,
      createdAt: now - 40 * 60 * 1000,
      updatedAt: now - 40 * 60 * 1000,
    },
    {
      id: "emg-2",
      type: "medical",
      description: "Student feeling unwell after boarding at M.R NAGAR; driver informed.",
      location: "Near M.R NAGAR stop",
      busId: "bus-26",
      busNumber: "TN 11 F 0258",
      routeNumber: 26,
      reportedById: "user-teacher-1",
      reportedByName: "Dr. Anand Kumar",
      status: "acknowledged",
      adminResponse: "Transport office aware; paramedic contact shared with the driver.",
      createdAt: now - 5 * HOUR,
      updatedAt: now - 4 * HOUR,
    },
    {
      id: "emg-3",
      type: "accident",
      description: "Minor bumper scrape with a two-wheeler near the college gate; no injuries.",
      location: "College gate, Poonamallee",
      busId: "bus-21",
      busNumber: "TN 22 BS 3669",
      routeNumber: 21,
      reportedById: "user-student-1",
      reportedByName: "Dharshan E",
      status: "resolved",
      adminResponse: "Insurer intimated; bus cleared to continue.",
      createdAt: now - 2 * DAY - 3 * HOUR,
      updatedAt: now - 2 * DAY - HOUR,
    },
  ];

  const maintenance = [
    {
      id: "mnt-1",
      busId: "bus-28",
      type: "repair",
      serviceDate: today,
      nextServiceDate: new Date(now + 12 * DAY).toISOString().slice(0, 10),
      description: "Brake pads worn; full brake service with fluid flush.",
      cost: 4850,
      status: "in_progress",
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    },
    {
      id: "mnt-2",
      busId: "bus-25",
      type: "routine",
      serviceDate: new Date(now + 6 * DAY).toISOString().slice(0, 10),
      nextServiceDate: new Date(now + 36 * DAY).toISOString().slice(0, 10),
      description: "Scheduled 10,000 km routine service: oil, filters and tyre rotation.",
      cost: 6200,
      status: "scheduled",
      createdAt: now - DAY,
      updatedAt: now - DAY,
    },
    {
      id: "mnt-3",
      busId: "bus-21",
      type: "inspection",
      serviceDate: new Date(now - 5 * DAY).toISOString().slice(0, 10),
      nextServiceDate: new Date(now + 25 * DAY).toISOString().slice(0, 10),
      description: "Annual fitness inspection passed; seatbelt check completed.",
      cost: 950,
      status: "completed",
      createdAt: now - 6 * DAY,
      updatedAt: now - 5 * DAY,
    },
  ];

  const settings = {
    id: "settings-1",
    transportName: "DACE Transport",
    academicYear: "2026-2027",
    complaintCategories: [
      "Bus Delay",
      "Vehicle Problem",
      "Driver Issue",
      "Route Issue",
      "Student Safety",
      "Bus Stop Issue",
      "Other",
    ],
    emergencyCategories: ["accident", "breakdown", "medical", "safety", "other"],
    busStatusTypes: ["active", "maintenance", "inactive"],
    notificationPreferences: {
      newComplaint: true,
      emergencyAlert: true,
      busDelay: true,
    },
    updatedAt: now,
  };

  return {
    users,
    buses,
    routes,
    stops: [],
    complaints,
    feedback: [],
    notifications,
    attendance,
    passengerCounts,
    drivers,
    emergencies,
    maintenance,
    settings: [settings],
    devices: [],
    meta: { seededAt: now },
  };
}