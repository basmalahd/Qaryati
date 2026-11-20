// Read-heavy scenario: village listing/search + details.
//   k6 run -e BASE_URL=http://localhost:3000 perf/read-villages.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
export const options = {
  stages: [{ duration: '15s', target: 20 }, { duration: '30s', target: 50 }, { duration: '10s', target: 0 }],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'max'],
};

export default function () {
  const list = http.get(`${BASE}/api/v1/villages?q=a&sort=-population&size=20`);
  check(list, { 'list 200': (r) => r.status === 200 });
  const rows = list.status === 200 ? list.json('data') : [];
  if (rows.length) {
    const id = rows[Math.floor(Math.random() * rows.length)].id;
    check(http.get(`${BASE}/api/v1/villages/${id}/overview`), { 'overview 200': (r) => r.status === 200 });
  }
  sleep(0.1);
}
