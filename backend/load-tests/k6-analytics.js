/**
 * k6 Load Test: Admin Analytics Heavy Queries
 * Tests the most expensive analytics endpoints under load.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 10)
 *   DURATION - Test duration (default: 60s)
 *   ADMIN_EMAIL - Admin email
 *   ADMIN_PASSWORD - Admin password
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '10');
const DURATION = __ENV.DURATION || '60s';

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@dtms.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';

const errorRate = new Rate('errors');
const rateLimitRate = new Rate('rate_limits');
const analyticsDuration = new Trend('analytics_duration', true);
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { duration: '10s', target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.01'],
  },
};

function loginAdmin() {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
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

const analyticsEndpoints = [
  '/api/admin/analytics/dashboard',
  '/api/admin/analytics/overview',
  '/api/admin/analytics/attendance',
  '/api/admin/analytics/attendance/daily',
  '/api/admin/analytics/buses',
  '/api/admin/analytics/routes',
  '/api/admin/analytics/assignments',
  '/api/admin/analytics/complaints',
  '/api/admin/analytics/complaints/daily',
  '/api/admin/analytics/feedback',
  '/api/admin/analytics/emergencies',
  '/api/admin/analytics/emergencies/summary',
  '/api/admin/analytics/schedules',
  '/api/admin/analytics/notifications',
];

export default function () {
  const token = loginAdmin();
  if (!token) {
    sleep(1);
    return;
  }

  // Pick a random analytics endpoint
  const endpoint = analyticsEndpoints[Math.floor(Math.random() * analyticsEndpoints.length)];

  const res = http.get(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  totalRequests.add(1);
  analyticsDuration.add(res.timings.duration);

  check(res, {
    'analytics status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'analytics response < 3s': (r) => r.timings.duration < 3000,
  });

  if (res.status === 429) {
    rateLimitRate.add(1);
  }
  errorRate.add(res.status >= 500);

  sleep(Math.random() * 2 + 1);
}
