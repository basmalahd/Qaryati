# Architecture

Layered modular monolith with dependency injection at the edges.

```mermaid
flowchart LR
  C[Client] --> MW[helmet / CORS / rate limit / JSON parser]
  MW --> R[Routers + authn/authz]
  R --> CT[Controllers: Zod validation + DTO mapping]
  CT --> S[Services: domain rules, transactions]
  S --> P[Repository ports]
  P --> A[Prisma adapters + native SQL]
  A --> DB[(PostgreSQL)]
  S --> G[Geocoding adapter -> external provider]
```

* **Controllers** only parse/validate input and map output. **Services** hold business rules and receive their repositories (and a `transaction` function) through the constructor, so they are unit-testable with in-memory mocks (`tests/mocks`).
* **Composition roots**: `src/app.js` (HTTP stack, auth) and `src/modules/villages/village.module.js` (village domain wiring).
* **Adapters**: `prisma-village-module.repositories.js` implements the repository ports; village listing uses native SQL (`$queryRaw`) for the "latest verified population" join, filtering, sorting and pagination.
* **Cross-cutting**: problem+json error model (`src/middleware/error.middleware.js`), BigInt-safe JSON, rate limiting, helmet, CORS allow-list.

## ERD (core)

```mermaid
erDiagram
  Governorate ||--o{ Village : contains
  Village ||--o{ VillageName : has
  Village ||--o{ PopulationRecord : has
  Village ||--o{ Landmark : has
  Village ||--o{ HeritageItem : has
  Village ||--o{ HistoricalEvent : has
  Village ||--o{ AgricultureItem : has
  Village ||--o{ EconomicActivity : has
  Village ||--o{ PublicFacility : has
  Village }o--o{ Village : "nearby (VillageRelation)"
  Source ||--o{ PopulationRecord : references
  Source ||--o{ Village : references
  User ||--o{ UserRole : has
  Role ||--o{ UserRole : grants
  User ||--o{ AuditLog : performs
  User ||--o{ ContentVersion : "submits / reviews"
```
