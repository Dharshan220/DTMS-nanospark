/**
 * k6 Load Test: Mixed Realistic Workload (Token-Cached)
 * Simulates realistic traffic: login once, then hit authenticated endpoints.
 * 85% Student, 14% Faculty, 1% Admin role distribution.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 10)
 *   DURATION - Test duration (default: 60s)
 *   STUDENT_EMAIL - Student email
 *   STUDENT_PASSWORD - Student password
 *   FACULTY_EMAIL - Faculty email
 *   FACULTY_PASSWORD - Faculty password
 *   ADMIN_EMAIL - Admin email
 *   ADMIN_PASSWORD - Admin password
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

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
const rateLimitRate = new Rate('rate_limits');
const requestDuration = new Trend('request_duration', true);
const totalRequests = new Counter('total_requests');

// Token store: VUs cache their tokens across iterations
const tokens = {};

export const options = {
  stages: [
    { duration: '15s', target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.01'],
  },
};

function getVURole(vuId) {
  const rand = vuId % 100;
  if (rand < 85) return 'student';
  if (rand < 99) return 'faculty';
  return 'admin';
}

function login(role) {
  let email, password;
  switch (role) {
    case 'student':
      email = STUDENT_EMAIL;
      password = STUDENT_PASSWORD;
      break;
    case 'faculty':
      email = FACULTY_EMAIL;
      password = FACULTY_PASSWORD;
      break;
    case 'admin':
      email = ADMIN_EMAIL;
      password = ADMIN_PASSWORD;
      break;
  }

  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email, password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status !== 200) return null;

  try {
    return JSON.parse(res.body).accessToken;
  } catch {
    return null;
  }
}

function getToken(vuId, role) {
  if (tokens[vuId]) return tokens[vuId];
  const token = login(role);
  if (token) tokens[vuId] = token;
  return token;
}

function makeRequest(method, url, token) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  let res;
  if (method === 'GET') {
    res = http.get(`${BASE_URL}${url}`, params);
  } else if (method === 'POST') {
    res = http.post(`${BASE_URL}${url}`, null, params);
  }

  totalRequests.add(1);
  requestDuration.add(res.timings.duration);

  if (res.status === 429) {
    rateLimitRate.add(1);
    errorRate.add(0);
  } else if (res.status >= 500) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  return res;
}

export default function () {
  const vuId = __VU;
  const role = getVURole(vuId);

  // Get cached token (login once per VU, reuse)
  const token = getToken(vuId, role);
  if (!token) {
    sleep(1);
    return;
  }

  // Random endpoint selection per role
  if (role === 'student') {
    const endpoints = [
      '/api/student/profile',
      '/api/student/schedules/my',
      '/api/notifications?limit=10',
      '/api/student/complaints?limit=10',
      '/api/student/feedback?limit=10',
    ];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    makeRequest('GET', ep, token);
  }

  if (role === 'faculty') {
    const endpoints = [
      '/api/faculty/profile',
      '/api/faculty/schedules/my',
      '/api/notifications?limit=10',
    ];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    makeRequest('GET', ep, token);
  }

  if (role === 'admin') {
    const endpoints = [
      '/api/admin/analytics/dashboard',
      '/api/admin/students?limit=10',
      '/api/admin/faculty?limit=10',
      '/api/admin/schedules?limit=10',
      '/api/admin/complaints?limit=10',
      '/api/admin/feedback?limit=10',
      '/api/admin/notifications?limit=10',
      '/api/admin/audit-logs?limit=10',
    ];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    makeRequest('GET', ep, token);
  }

  sleep(1);
}
