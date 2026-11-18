# Qaryati — Palestinian Villages Knowledge Platform

API-centric backend (Node.js 22, Express 5, Prisma 7, PostgreSQL 16) for structured, sourced and auditable information about Palestinian villages. Advanced Software Engineering — Fall 2026.

## Quick start (Docker)

```bash
cp .env.example .env      # set DB_PASSWORD, JWT_ACCESS_SECRET (>=32 chars), SEED_* accounts
docker compose up --build
curl http://localhost:3000/api/v1/health
```
The container applies migrations and seeds roles + governorates (+ the `SEED_*` accounts) on start.

## Quick start (local)

```bash
npm ci
cp .env.example .env                  # DATABASE_URL, JWT_ACCESS_SECRET, SEED_*
npx prisma generate && npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Tests

```bash
npm test                              # unit + route tests (no database needed)
RUN_DB_TESTS=1 npm test               # + end-to-end flow against a real PostgreSQL
```

## Domain rules (how data quality is handled)

* **Nothing is published directly.** Creating a village / population record creates a `PENDING` draft plus a `ContentVersion` snapshot. Edits (`PUT`/`PATCH`) create a pending version only — the live row is untouched.
* A **VERIFIER** (or ADMIN) approves/rejects at `POST /api/v1/review/versions/{id}/approve|reject`. Approval applies the snapshot atomically (row lock + transaction) and writes an audit entry. Rejection needs a reason.
* **Maker–checker:** the reviewer must differ from the submitter (enforced in the service *and* by a DB CHECK).
* Only one pending version per entity (partial unique index) — concurrent edits get `409`, never a silent overwrite.
* Every change writes to `AuditLog` (who, what, when, old/new value) in the same transaction as the change.
* Public endpoints only ever return `VERIFIED`, non-deleted rows. Deletes are soft deletes.

| Role | Can |
|---|---|
| anonymous | read published data |
| EDITOR | propose creates/edits, manage sources |
| VERIFIER | review (approve/reject) proposals |
| ADMIN | everything incl. soft delete/restore, governorates |

## API (all under `/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /users/me` |
| Villages | `GET/POST /villages`, `GET/PUT/PATCH/DELETE /villages/{id}`, `GET /villages/{id}/overview`, `POST /villages/{id}/restore`, `GET /admin/villages` (deleted) |
| Search | `GET /villages?q=&governorate_id=&min_population=&max_population=&has_landmarks=&sort=-population,current_name_ar&page=&size=` |
| Names / nearby | `/villages/{id}/names[/{nameId}]`, `/villages/{id}/nearby[/{otherId}]` |
| Population history | `/villages/{id}/population-records[/{recordId}|/latest]` |
| Governorates | `/governorates`, `/governorates/{id}/villages` |
| Review | `GET /review/versions`, `POST /review/versions/{id}/approve|reject` |
| Supporting content (read) | `/landmarks`, `/heritage-items`, `/agriculture-items`, `/economic-activities`, `/public-facilities`, `/historical-events`, `/sources` |

Errors use `application/problem+json` with an `error_code` (`VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `DUPLICATE_*`, `ACCESS_DENIED`, `RATE_LIMITED`, …).

## Load testing (k6)

```bash
k6 run -e BASE_URL=http://localhost:3000 perf/read-villages.js
k6 run -e BASE_URL=http://localhost:3000 -e EMAIL=admin@... -e PASSWORD=... perf/write-villages.js
```
Run against a seeded database of realistic size, record avg / p95 / throughput / error rate, then compare before/after one indexing or caching change (see `docs/performance-report.md`).

## Architecture

See `docs/architecture.md` and the ADRs in `docs/adr/`.
