/**
 * k6 Load Test: Write Operations
 * Tests creating complaints, feedback, and notifications under load.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 10)
 *   DURATION - Test duration (default: 60s)
 *   STUDENT_EMAIL - Student email
 *   STUDENT_PASSWORD - Student password
 *   ADMIN_EMAIL - Admin email
 *   ADMIN_PASSWORD - Admin password
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '10');
const DURATION = __ENV.DURATION || '60s';

const STUDENT_EMAIL = __ENV.STUDENT_EMAIL || 'loadtest.student1@dtms.local';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || 'LoadTest123';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@dtms.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';

const errorRate = new Rate('errors');
const rateLimitRate = new Rate('rate_limits');
const writeDuration = new Trend('write_duration', true);
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

function login(email, password) {
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

export default function () {
  const vuId = __VU;

  // Student writes
  const studentToken = login(STUDENT_EMAIL, STUDENT_PASSWORD);
  if (studentToken) {
    const complaintRes = http.post(`${BASE_URL}/api/student/complaints`, JSON.stringify({
      subject: `Load Test Complaint ${vuId}-${Date.now()}`,
      description: `Automated load test complaint from VU ${vuId}`,
      category: 'BUS',
      priority: 'LOW',
    }), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });

    totalRequests.add(1);
    writeDuration.add(complaintRes.timings.duration);

    if (complaintRes.status === 429) {
      rateLimitRate.add(1);
    } else {
      errorRate.add(complaintRes.status >= 500);
    }
  }

  sleep(1);

  // Admin writes (notification test)
  const adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
  if (adminToken) {
    const notifRes = http.post(`${BASE_URL}/api/admin/notifications/announcement`, JSON.stringify({
      title: `Load Test Announcement ${vuId}`,
      message: `Automated load test announcement from VU ${vuId}`,
      target: 'ALL',
    }), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });

    totalRequests.add(1);
    writeDuration.add(notifRes.timings.duration);

    if (notifRes.status === 429) {
      rateLimitRate.add(1);
    } else {
      errorRate.add(notifRes.status >= 500);
    }
  }

  sleep(1);
}
