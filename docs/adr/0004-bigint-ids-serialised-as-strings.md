# ADR 0004 — BigInt primary keys are serialised as strings

**Status:** accepted

**Context.** PostgreSQL `BIGINT` ids are JavaScript `BigInt` in Prisma, and `JSON.stringify` throws on them (HTTP 500 on every supporting-content endpoint).

**Decision.** `src/shared/bigint.js` defines `BigInt.prototype.toJSON` as a global safety net; the village module's mappers additionally emit ids as strings and repositories convert to numbers internally.

**Consequences.** Clients must treat ids as opaque strings. The global patch is process-wide; it is documented here because it is a deliberate trade-off against per-endpoint mappers.
