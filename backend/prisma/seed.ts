import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@dtms.local';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    console.error(
      '\nSeed aborted: ADMIN_PASSWORD must be set in .env and be at least 8 characters.',
    );
    process.exit(1);
  }

  const unsafeDefaults = ['Admin@12345', 'admin123', 'password', 'Password123'];
  if (process.env.NODE_ENV === 'production' && unsafeDefaults.includes(adminPassword)) {
    console.error(
      '\nSeed aborted: Do not use a default/weak password in production.',
    );
    process.exit(1);
  }

  console.log('\nStarting DTMS development seed...\n');

  const hash = await bcrypt.hash(adminPassword, 12);
  const testHash = await bcrypt.hash('TestPass123', 12);

  // ── Admin ──────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let adminUserId: string | null = existingAdmin?.id ?? null;

  if (!existingAdmin) {
    const created = await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, role: 'ADMIN', status: 'ACTIVE' },
    });
    adminUserId = created.id;
    console.log(`  Admin created: ${adminEmail}`);
  } else {
    console.log(`  Admin exists: ${adminEmail}`);
  }

  // ── Faculty ────────────────────────────────────────
  const facultyEmails = ['rani.faculty@dtms.local', 'velu.faculty@dtms.local'];
  const facultyNames = ['Rani Sharma', 'Velu Murugan'];
  const facultyIds = ['FAC-001', 'FAC-002'];
  const facultyDepts = ['Computer Science', 'Electronics'];
  const facultyProfileIds: string[] = [];

  for (let i = 0; i < facultyEmails.length; i++) {
    const existing = await prisma.user.findUnique({ where: { email: facultyEmails[i] } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: facultyEmails[i],
          passwordHash: testHash,
          role: 'FACULTY',
          status: 'ACTIVE',
          faculty: {
            create: {
              facultyId: facultyIds[i],
              name: facultyNames[i],
              department: facultyDepts[i],
              phone: '+91-900000000' + (i + 1),
              status: 'ACTIVE',
            },
          },
        },
        include: { faculty: true },
      });
      if (created.faculty) facultyProfileIds.push(created.faculty.id);
      console.log(`  Faculty created: ${facultyNames[i]}`);
    } else {
      const profile = await prisma.faculty.findUnique({ where: { userId: existing.id } });
      if (profile) facultyProfileIds.push(profile.id);
      console.log(`  Faculty exists: ${facultyNames[i]}`);
    }
  }

  // ── Students ───────────────────────────────────────
  const studEmails = [
    'arjun.student@dtms.local', 'priya.student@dtms.local',
    'rahul.student@dtms.local', 'meena.student@dtms.local', 'kiran.student@dtms.local',
  ];
  const studNames = ['Arjun Kumar', 'Priya Devi', 'Rahul Verma', 'Meena Kumari', 'Kiran Raj'];
  const studRegs = ['STU-2024-001', 'STU-2024-002', 'STU-2024-003', 'STU-2024-004', 'STU-2024-005'];
  const studDepts = ['CSE', 'CSE', 'ECE', 'ECE', 'CSE'];
  const studYears = ['3', '3', '2', '2', '1'];
  const studSections = ['A', 'A', 'B', 'B', 'A'];
  const studGenders = ['male', 'female', 'male', 'female', 'male'];
  const studentProfileIds: string[] = [];
  const studentUserIds: string[] = [];

  for (let i = 0; i < studEmails.length; i++) {
    const existing = await prisma.user.findUnique({ where: { email: studEmails[i] } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: studEmails[i],
          passwordHash: testHash,
          role: 'STUDENT',
          status: 'ACTIVE',
          student: {
            create: {
              registerNumber: studRegs[i],
              name: studNames[i],
              department: studDepts[i],
              year: studYears[i],
              section: studSections[i],
              gender: studGenders[i],
              phone: '+91-980000000' + (i + 1),
              status: 'ACTIVE',
            },
          },
        },
        include: { student: true },
      });
      if (created.student) {
        studentProfileIds.push(created.student.id);
        studentUserIds.push(created.id);
      }
      console.log(`  Student created: ${studNames[i]}`);
    } else {
      const profile = await prisma.student.findUnique({ where: { userId: existing.id } });
      if (profile) {
        studentProfileIds.push(profile.id);
        studentUserIds.push(existing.id);
      }
      console.log(`  Student exists: ${studNames[i]}`);
    }
  }

  // ── Drivers ────────────────────────────────────────
  const drvCodes = ['DRV-001', 'DRV-002'];
  const drvNames = ['Murugan S', 'Senthil K'];
  const drvPhones = ['+91-8800000001', '+91-8800000002'];
  const drvLicenses = ['TN-2024-DRV-001', 'TN-2024-DRV-002'];
  const driverIds: string[] = [];

  for (let i = 0; i < drvCodes.length; i++) {
    const existing = await prisma.driver.findUnique({ where: { driverCode: drvCodes[i] } });
    if (!existing) {
      const created = await prisma.driver.create({
        data: {
          driverCode: drvCodes[i],
          name: drvNames[i],
          phone: drvPhones[i],
          licenseNumber: drvLicenses[i],
          experienceYears: 5,
          status: 'ACTIVE',
        },
      });
      driverIds.push(created.id);
      console.log(`  Driver created: ${drvNames[i]}`);
    } else {
      driverIds.push(existing.id);
      console.log(`  Driver exists: ${drvNames[i]}`);
    }
  }

  // ── Routes ─────────────────────────────────────────
  const rteCodes = ['RTE-001', 'RTE-002'];
  const rteNames = ['City Center Route', 'Industrial Area Route'];
  const rteDescs = ['Via Main Road, Gandhipuram', 'Via SIDCO, Peelamedu'];
  const routeIds: string[] = [];

  for (let i = 0; i < rteCodes.length; i++) {
    const existing = await prisma.route.findUnique({ where: { routeCode: rteCodes[i] } });
    if (!existing) {
      const created = await prisma.route.create({
        data: {
          routeCode: rteCodes[i],
          routeName: rteNames[i],
          description: rteDescs[i],
          status: 'ACTIVE',
        },
      });
      routeIds.push(created.id);
      console.log(`  Route created: ${rteNames[i]}`);
    } else {
      routeIds.push(existing.id);
      console.log(`  Route exists: ${rteNames[i]}`);
    }
  }

  // ── Bus Stops ──────────────────────────────────────
  const stopCodes = ['STOP-001', 'STOP-002', 'STOP-003', 'STOP-004'];
  const stopNames = ['Gandhipuram Bus Stand', 'RS Puram', 'Peelamedu', 'SIDCO Industrial Estate'];
  const stopLats = [11.0168, 11.0058, 11.0288, 11.0428];
  const stopLngs = [76.9558, 76.9498, 77.0138, 77.0258];
  const stopIds: string[] = [];

  for (let i = 0; i < stopCodes.length; i++) {
    const existing = await prisma.busStop.findUnique({ where: { stopCode: stopCodes[i] } });
    if (!existing) {
      const created = await prisma.busStop.create({
        data: {
          stopCode: stopCodes[i],
          name: stopNames[i],
          latitude: stopLats[i],
          longitude: stopLngs[i],
          status: 'ACTIVE',
        },
      });
      stopIds.push(created.id);
      console.log(`  Stop created: ${stopNames[i]}`);
    } else {
      stopIds.push(existing.id);
      console.log(`  Stop exists: ${stopNames[i]}`);
    }
  }

  // ── Route Stops ────────────────────────────────────
  if (routeIds.length >= 2 && stopIds.length >= 4) {
    const existingRS = await prisma.routeStop.count({ where: { routeId: routeIds[0] } });
    if (existingRS === 0) {
      await prisma.routeStop.createMany({
        data: [
          { routeId: routeIds[0], busStopId: stopIds[0], stopOrder: 1, estimatedArrivalTime: '08:00' },
          { routeId: routeIds[0], busStopId: stopIds[1], stopOrder: 2, estimatedArrivalTime: '08:15' },
          { routeId: routeIds[1], busStopId: stopIds[2], stopOrder: 1, estimatedArrivalTime: '08:00' },
          { routeId: routeIds[1], busStopId: stopIds[3], stopOrder: 2, estimatedArrivalTime: '08:20' },
        ],
      });
      console.log('  Route stops created');
    } else {
      console.log('  Route stops exist');
    }
  }

  // ── Buses ──────────────────────────────────────────
  const busNumbers = [1001, 1002];
  const busRegs = ['TN-24-ABC-001', 'TN-24-ABC-002'];
  const busCapacities = [60, 45];
  const busIds: string[] = [];

  for (let i = 0; i < busNumbers.length; i++) {
    const existing = await prisma.bus.findUnique({ where: { busNumber: busNumbers[i] } });
    if (!existing) {
      const created = await prisma.bus.create({
        data: {
          busNumber: busNumbers[i],
          registrationNumber: busRegs[i],
          capacity: busCapacities[i],
          boysCapacity: busCapacities[i] === 60 ? 35 : 25,
          girlsCapacity: busCapacities[i] === 60 ? 25 : 20,
          driverId: driverIds[i] || null,
          routeId: routeIds[i] || null,
          status: 'ACTIVE',
        },
      });
      busIds.push(created.id);
      console.log(`  Bus created: ${busNumbers[i]}`);
    } else {
      busIds.push(existing.id);
      console.log(`  Bus exists: ${busNumbers[i]}`);
    }
  }

  // ── Student Assignments ────────────────────────────
  if (studentProfileIds.length > 0 && busIds.length > 0 && stopIds.length > 0) {
    const existingAssign = await prisma.studentBusAssignment.count();
    if (existingAssign === 0) {
      for (let i = 0; i < Math.min(studentProfileIds.length, 5); i++) {
        const busIdx = i < 3 ? 0 : 1;
        const stopIdx = busIdx === 0 ? 0 : 2;
        await prisma.studentBusAssignment.create({
          data: {
            studentId: studentProfileIds[i],
            busId: busIds[busIdx],
            busStopId: stopIds[stopIdx],
            status: 'ACTIVE',
          },
        });
      }
      console.log('  Student assignments created');
    } else {
      console.log('  Student assignments exist');
    }
  }

  // ── Faculty Assignments ────────────────────────────
  if (facultyProfileIds.length > 0 && busIds.length > 0) {
    const existingFAssign = await prisma.facultyBusAssignment.count();
    if (existingFAssign === 0) {
      for (const fpId of facultyProfileIds) {
        await prisma.facultyBusAssignment.create({
          data: { facultyId: fpId, busId: busIds[0], status: 'ACTIVE' },
        });
      }
      console.log('  Faculty assignments created');
    } else {
      console.log('  Faculty assignments exist');
    }
  }

  // ── Attendance Records ─────────────────────────────
  const existingAtt = await prisma.attendance.count();
  if (existingAtt === 0 && busIds.length > 0 && facultyProfileIds.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.attendance.createMany({
      data: [
        { busId: busIds[0], facultyId: facultyProfileIds[0], date: today, tripType: 'MORNING', boysCount: 22, girlsCount: 15, totalCount: 37 },
        { busId: busIds[0], facultyId: facultyProfileIds[0], date: yesterday, tripType: 'MORNING', boysCount: 20, girlsCount: 14, totalCount: 34 },
        { busId: busIds[0], facultyId: facultyProfileIds[0], date: yesterday, tripType: 'EVENING', boysCount: 19, girlsCount: 13, totalCount: 32 },
      ],
    });
    console.log('  Attendance records created');
  } else {
    console.log('  Attendance records exist');
  }

  // ── Complaints ─────────────────────────────────────
  const existingComplaints = await prisma.complaint.count();
  if (existingComplaints === 0 && studentProfileIds.length > 0) {
    await prisma.complaint.createMany({
      data: [
        {
          studentId: studentProfileIds[0],
          subject: 'AC not working in Bus 1001',
          description: 'The air conditioning in bus 1001 was not working during the morning trip.',
          category: 'BUS', priority: 'HIGH', status: 'OPEN',
          busId: busIds[0] || undefined,
        },
        {
          studentId: studentProfileIds[1],
          subject: 'Driver was speeding',
          description: 'The driver was overspeeding near the highway stretch.',
          category: 'DRIVER', priority: 'MEDIUM', status: 'IN_REVIEW',
          busId: busIds[0] || undefined,
          driverId: driverIds[0] || undefined,
        },
        {
          studentId: studentProfileIds[2],
          subject: 'Late arrival at pickup point',
          description: 'Bus arrived 15 minutes late at the RS Puram stop.',
          category: 'ROUTE', priority: 'LOW', status: 'RESOLVED',
          routeId: routeIds[0] || undefined,
          resolutionNote: 'Schedule adjusted. Driver briefed.',
          resolvedAt: new Date(),
        },
      ],
    });
    console.log('  Complaints created');
  } else {
    console.log('  Complaints exist');
  }

  // ── Feedback ───────────────────────────────────────
  const existingFeedback = await prisma.feedback.count();
  if (existingFeedback === 0 && studentProfileIds.length > 0) {
    await prisma.feedback.createMany({
      data: [
        { studentId: studentProfileIds[0], subject: 'Good bus service', message: 'The bus service has improved significantly.', rating: 4, category: 'SERVICE', status: 'SUBMITTED' },
        { studentId: studentProfileIds[1], subject: 'Route needs more stops', message: 'Adding a stop near pharmacy college would help.', rating: 3, category: 'ROUTE', status: 'REVIEWED', reviewedAt: new Date() },
        { studentId: studentProfileIds[2], subject: 'Friendly driver', message: 'Driver Murugan is very polite and drives safely.', rating: 5, category: 'DRIVER', status: 'RESOLVED', reviewedAt: new Date() },
      ],
    });
    console.log('  Feedback created');
  } else {
    console.log('  Feedback exists');
  }

  // ── Emergency Alerts ───────────────────────────────
  const existingEmergency = await prisma.emergencyAlert.count();
  if (existingEmergency === 0 && studentProfileIds.length > 0 && studentUserIds.length > 0) {
    await prisma.emergencyAlert.create({
      data: {
        userId: studentUserIds[0],
        role: 'STUDENT',
        studentId: studentProfileIds[0],
        busId: busIds[0] || undefined,
        routeId: routeIds[0] || undefined,
        message: 'Medical emergency - student feeling faint',
        type: 'MEDICAL', priority: 'CRITICAL', status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: adminUserId || undefined,
        resolutionNote: 'Student taken to hospital. Parents notified.',
      },
    });
    console.log('  Emergency alert created');
  } else {
    console.log('  Emergency alerts exist');
  }

  // ── Transport Schedules ────────────────────────────
  const existingSchedules = await prisma.transportSchedule.count();
  if (existingSchedules === 0 && busIds.length > 0 && routeIds.length > 0) {
    const effectiveFrom = new Date();
    effectiveFrom.setHours(0, 0, 0, 0);

    await prisma.transportSchedule.createMany({
      data: [
        { busId: busIds[0], routeId: routeIds[0], tripType: 'MORNING', departureTime: '07:30', expectedArrivalTime: '08:30', effectiveFrom, status: 'ACTIVE', createdBy: adminUserId || undefined },
        { busId: busIds[0], routeId: routeIds[0], tripType: 'EVENING', departureTime: '16:30', expectedArrivalTime: '17:30', effectiveFrom, status: 'ACTIVE', createdBy: adminUserId || undefined },
        { busId: busIds[1], routeId: routeIds[1], tripType: 'MORNING', departureTime: '07:45', expectedArrivalTime: '08:45', effectiveFrom, status: 'ACTIVE', createdBy: adminUserId || undefined },
      ],
    });
    console.log('  Transport schedules created');
  } else {
    console.log('  Transport schedules exist');
  }

  // ── Notifications ──────────────────────────────────
  const existingNotifications = await prisma.notification.count();
  if (existingNotifications === 0 && adminUserId) {
    await prisma.notification.createMany({
      data: [
        { userId: adminUserId, type: 'TRANSPORT', channel: 'IN_APP', title: 'System Ready', message: 'DTMS backend initialized successfully.', status: 'DELIVERED' },
        { userId: adminUserId, type: 'SYSTEM', channel: 'IN_APP', title: 'Welcome', message: 'Welcome to the Dashboard Transport Management System.', status: 'READ' },
      ],
    });
    console.log('  Notifications created');
  } else {
    console.log('  Notifications exist');
  }

  console.log('\nDevelopment seed completed successfully!\n');
  console.log('Login credentials:');
  console.log(`  Admin:   ${adminEmail} / ${adminPassword}`);
  console.log('  Faculty: rani.faculty@dtms.local / TestPass123');
  console.log('  Student: arjun.student@dtms.local / TestPass123\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
