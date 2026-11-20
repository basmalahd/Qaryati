# Performance report (template — fill with YOUR measurements)

Environment: CPU/RAM, Node version, PostgreSQL version, dataset size (villages / population records).

| Scenario | VUs | avg | p95 | throughput (req/s) | error rate |
|---|---|---|---|---|---|
| Read: list/search + overview (`perf/read-villages.js`) | | | | | |
| Write: authenticated create (`perf/write-villages.js`) | | | | | |

**Bottleneck found** (evidence: `EXPLAIN (ANALYZE, BUFFERS)`, CPU, pool wait):

**Root cause:**

**Optimisation applied** (e.g. trigram index for `ILIKE`, cache for public reads, pool size):

**Before / after:**
