// Write-oriented scenario: authenticated draft creation (+ population record).
//   k6 run -e BASE_URL=... -e EMAIL=... -e PASSWORD=... -e GOVERNORATE_ID=1 perf/write-villages.js
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
export const options = {
  stages: [{ duration: '10s', target: 10 }, { duration: '30s', target: 20 }, { duration: '10s', target: 0 }],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<800'] },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

export function setup() {
  const res = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({ email: __ENV.EMAIL, password: __ENV.PASSWORD }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const body = JSON.stringify({ current_name_ar: `قرية-${__VU}-${__ITER}-${Date.now()}`, governorate_id: Number(__ENV.GOVERNORATE_ID || 1) });
  const res = http.post(`${BASE}/api/v1/villages`, body, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` } });
  check(res, { 'created 201': (r) => r.status === 201 });
}
