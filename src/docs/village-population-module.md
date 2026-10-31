# Village and population module integration

This feature branch owns `src/modules/villages/`, `src/modules/governorates/`, `src/modules/population/`, the shared problem error helper, and the test mock factory. It does not change `src/app.js`, `package.json`, or Prisma files.

## Shared dependencies to agree before merge

- `express` for route construction.
- `zod` for request DTO validation.

The route factories accept Express and existing authentication/authorization middleware as arguments. Mount the routers in `src/app.js` after the owners agree on the shared dependencies:

```js
app.use('/api/v1/villages', createVillageRouter({ express, service: villageService, authenticate, authorize }));
app.use('/api/v1/villages', createVillageNameRouter({ express, service: villageNameService, authenticate, authorize }));
app.use('/api/v1/villages', createVillageRelationRouter({ express, service: villageRelationService, authenticate, authorize }));
app.use('/api/v1/villages', createPopulationRouter({ express, service: populationService, authenticate, authorize }));
app.use('/api/v1/governorates', createGovernorateRouter({ express, service: governorateService, villages: villageRepository, authenticate, authorize }));
app.use('/api/v1/admin/villages', createAdminVillageRouter({ express, service: villageService, authenticate, authorize }));
```

Provide concrete Prisma repositories and a Prisma `$transaction` adapter to the services. Transaction callbacks receive transaction-scoped `villages`, `records`, `versions`, and `audit` adapters. Village and population draft creation must atomically create their base row, pending version, and audit entry. Audited deletion/restoration must also be atomic. Repository methods are named at each service boundary; `tests/mocks/village-module.repositories.js` supplies in-memory equivalents for isolated development (its transaction adapter does not provide database rollback). Keep public repository reads scoped to verified, non-deleted rows and exclude children of unpublished/deleted villages.

## API and domain rules covered

- Public village search supports active names, governorate, verified population bounds, allow-listed sorting and 1-based pagination (default 20, max 100).
- Village creation and edits submit immutable pending `ContentVersion` snapshots. The published village projection must remain unchanged until the verification module approves the snapshot.
- Population dates are real calendar dates from 1800 through the current year. YEAR requires January 1, MONTH requires day 1, population must be positive, and source is required and active for new records.
- Population identity is `(village_id, reference_date, source_id)`; multiple sources can retain competing historical values. Latest uses date descending, then ID descending as deterministic tie-break.
- Village names are unique by `(village_id, name, language)`, including soft-deleted rows; restore conflicts must be reported.
- Village relations normalize IDs to one undirected pair and reject self-links.
- Governorate administration is restricted to Admin; deletion must return `409 RESOURCE_IN_USE` when any village, including a soft-deleted one, references it. Nearby-village routes follow `/villages/{id}/nearby`.
- Services use repository/audit interfaces only; no Prisma or cross-module private repository access is embedded in controllers.

The shared app must mount the error middleware to serialize `ProblemError` as RFC 9457 `application/problem+json` with `error_code` and `errors` extensions. Version creation, audit writes, and base-row creation must run in one Prisma transaction when concrete repositories are connected.
