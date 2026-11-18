# ADR 0001 — Layered architecture with injected repositories

**Status:** accepted

**Context.** Four people work in parallel; business rules (verification, audit, uniqueness) must be testable without a database and the data layer (Prisma) must be replaceable.

**Decision.** Controller → Service → Repository, where services receive repositories and a `transaction(work)` function via their constructor. Prisma adapters implement the same interface as the in-memory mocks. Composition happens in `village.module.js` / `app.js`.

**Consequences.** (+) fast unit tests, clear ownership boundaries, transactions are explicit. (−) more wiring code; the older "supporting content" modules still import their repository directly and should be migrated to the same style.
