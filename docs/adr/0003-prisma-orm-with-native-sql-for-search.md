# ADR 0003 — Prisma for CRUD, native SQL for search/listing

**Status:** accepted

**Context.** The assignment requires an ORM *and* appropriate native SQL. Village search filters/sorts by the *latest verified* population record, which is awkward and slow through nested ORM queries.

**Decision.** Prisma handles CRUD, relations and transactions. `GET /villages` uses one parameterised SQL query (`WITH latest AS (SELECT DISTINCT ON …)`, `COUNT(*) OVER()` for the total, whitelisted `ORDER BY`) to select the page of ids, then hydrates rows with Prisma. Indexes on foreign keys and filter columns are in migration `20261118000000_*`.

**Consequences.** (+) one round-trip for filter+sort+count, SQL injection-safe via tagged templates, easy to `EXPLAIN`. (−) two query styles to maintain; sort fields must stay in the whitelist (`SORT_SQL`).
