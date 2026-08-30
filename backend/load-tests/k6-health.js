/**
 * k6 Load Test: Health Endpoint (Unauthenticated)
 * Tests pure server performance without auth overhead.
 * 
 * Environment variables:
 *   BASE_URL - Backend URL (default: http://localhost:5000)
 *   VUS - Number of virtual users (default: 10)
 *   DURATION - Test duration (default: 60s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '10');
const DURATION = __ENV.DURATION || '60s';

const errorRate = new Rate('errors');
const healthDuration = new Trend('health_duration', true);

export const options = {
  stages: [
    { duration: '10s', target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);

  check(res, {
    'health status 200': (r) => r.status === 200,
    'health response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(res.status !== 200);
  healthDuration.add(res.timings.duration);

  sleep(1);
}
