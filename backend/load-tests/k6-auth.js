/**
 * k6 Load Test: Authentication Flow
 * Tests login, token validation, and profile retrieval.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 10)
 *   DURATION - Test duration (default: 60s)
 *   STUDENT_EMAIL - Student email for login
 *   STUDENT_PASSWORD - Student password
 *   FACULTY_EMAIL - Faculty email for login
 *   FACULTY_PASSWORD - Faculty password
 *   ADMIN_EMAIL - Admin email for login
 *   ADMIN_PASSWORD - Admin password
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '10');
const DURATION = __ENV.DURATION || '60s';

const STUDENT_EMAIL = __ENV.STUDENT_EMAIL || 'loadtest.student1@dtms.local';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || 'LoadTest123';
const FACULTY_EMAIL = __ENV.FACULTY_EMAIL || 'loadtest.faculty1@dtms.local';
const FACULTY_PASSWORD = __ENV.FACULTY_PASSWORD || 'LoadTest123';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@dtms.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const profileDuration = new Trend('profile_duration', true);

export const options = {
  stages: [
    { duration: '10s', target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    errors: ['rate<0.01'],
  },
};

function getCredentials(vuId) {
  const role = vuId % 3;
  switch (role) {
    case 0: return { email: STUDENT_EMAIL, password: STUDENT_PASSWORD, profileUrl: '/api/student/profile' };
    case 1: return { email: FACULTY_EMAIL, password: FACULTY_PASSWORD, profileUrl: '/api/faculty/profile' };
    case 2: return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, profileUrl: '/api/auth/me' };
    default: return { email: STUDENT_EMAIL, password: STUDENT_PASSWORD, profileUrl: '/api/student/profile' };
  }
}

export default function () {
  const vuId = __VU;
  const creds = getCredentials(vuId);

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: creds.email,
    password: creds.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  loginDuration.add(loginRes.timings.duration);
  errorRate.add(loginRes.status !== 200);

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).accessToken;

  // Profile
  const profileRes = http.get(`${BASE_URL}${creds.profileUrl}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
  });

  profileDuration.add(profileRes.timings.duration);
  errorRate.add(profileRes.status !== 200);

  sleep(1);
}
