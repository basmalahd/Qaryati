# ADR 0002 — Pending versions + maker–checker review instead of overwriting

**Status:** accepted

**Context.** Historical and demographic data comes from conflicting or incomplete sources; the spec forbids silently overwriting data and requires auditable changes.

**Decision.** Writes create `PENDING` drafts and immutable `ContentVersion` snapshots. A different user with the VERIFIER/ADMIN role approves (snapshot applied in one transaction under a row lock) or rejects (reason required). One pending version per entity is enforced by a partial unique index; reviewer ≠ submitter is enforced by a CHECK constraint. All changes are written to `AuditLog` in the same transaction.

**Consequences.** (+) provenance, no lost updates, clear conflict strategy (second editor gets 409). (−) extra step before data is public; at least two accounts are needed to publish (seed creates admin + verifier).
