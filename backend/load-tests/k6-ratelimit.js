/**
 * k6 Load Test: Rate Limiting Validation
 * Tests that rate limiting works correctly under extreme load.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 50)
 *   DURATION - Test duration (default: 30s)
 *   ADMIN_EMAIL - Admin email
 *   ADMIN_PASSWORD - Admin password
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '50');
const DURATION = __ENV.DURATION || '30s';

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@dtms.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@12345';

const rateLimitHits = new Counter('rate_limit_hits');
const successfulReqs = new Counter('successful_requests');
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration', true);

export const options = {
  stages: [
    { duration: '5s', target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '5s', target: 0 },
  ],
};

export default function () {
  // Hammer the login endpoint
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  requestDuration.add(res.timings.duration);

  if (res.status === 429) {
    rateLimitHits.add(1);
  } else if (res.status === 200) {
    successfulReqs.add(1);
  } else {
    errorRate.add(1);
  }

  // No sleep - hammer as fast as possible
}
