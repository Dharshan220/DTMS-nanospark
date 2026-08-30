/**
 * Seed Load Test Users
 * Creates test users for load testing via the admin API.
 * Run: node seed-load-test-users.js
 * 
 * Environment variables:
 *   API_URL - Backend URL (default: http://localhost:5000/api)
 *   ADMIN_EMAIL - Admin email
 *   ADMIN_PASSWORD - Admin password
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dtms.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const data = await res.json();
  return data.accessToken;
}

async function createStudent(token, index) {
  const res = await fetch(`${API_URL}/admin/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: `loadtest.student${index}@dtms.local`,
      password: 'LoadTest123',
      registerNumber: `LT-STU-${String(index).padStart(4, '0')}`,
      name: `Load Test Student ${index}`,
      department: ['CSE', 'ECE', 'EEE', 'MECH'][index % 4],
      year: ['I', 'II', 'III', 'IV'][index % 4],
      section: ['A', 'B', 'C'][index % 3],
      gender: index % 2 === 0 ? 'male' : 'female',
      phone: `+91-9${String(700000000 + index).padStart(9, '0')}`,
    }),
  });
  if (res.ok) {
    console.log(`  Student ${index} created`);
    return true;
  }
  const err = await res.text();
  if (err.includes('already exists') || err.includes('duplicate')) {
    console.log(`  Student ${index} exists`);
    return true;
  }
  console.log(`  Student ${index} failed: ${res.status} ${err.substring(0, 100)}`);
  return false;
}

async function createFaculty(token, index) {
  const res = await fetch(`${API_URL}/admin/faculty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: `loadtest.faculty${index}@dtms.local`,
      password: 'LoadTest123',
      facultyId: `LT-FAC-${String(index).padStart(4, '0')}`,
      name: `Load Test Faculty ${index}`,
      department: ['CSE', 'ECE', 'EEE', 'MECH'][index % 4],
      phone: `+91-8${String(700000000 + index).padStart(9, '0')}`,
    }),
  });
  if (res.ok) {
    console.log(`  Faculty ${index} created`);
    return true;
  }
  const err = await res.text();
  if (err.includes('already exists') || err.includes('duplicate')) {
    console.log(`  Faculty ${index} exists`);
    return true;
  }
  console.log(`  Faculty ${index} failed: ${res.status} ${err.substring(0, 100)}`);
  return false;
}

async function main() {
  console.log('\n=== DTMS Load Test User Seeding ===\n');
  console.log(`API URL: ${API_URL}`);

  // Login as admin
  console.log('\nLogging in as admin...');
  let adminToken;
  try {
    adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Admin login successful');
  } catch (err) {
    console.error('Admin login failed:', err.message);
    console.log('Make sure the server is running and admin user is seeded.');
    process.exit(1);
  }

  // Create students (50 for load testing)
  console.log('\nCreating load test students (50)...');
  for (let i = 1; i <= 50; i++) {
    await createStudent(adminToken, i);
  }

  // Create faculty (10 for load testing)
  console.log('\nCreating load test faculty (10)...');
  for (let i = 1; i <= 10; i++) {
    await createFaculty(adminToken, i);
  }

  console.log('\n=== Load test user seeding complete ===\n');
  console.log('Test credentials:');
  console.log('  Admin:   admin@dtms.local / Admin@12345');
  console.log('  Faculty: loadtest.faculty1@dtms.local / LoadTest123');
  console.log('  Student: loadtest.student1@dtms.local / LoadTest123');
}

main().catch(console.error);
