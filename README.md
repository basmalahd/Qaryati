# Qaryati

Qaryati is an Express-based backend for village information, population records, heritage, agriculture, public facilities, and related content.

## Requirements

- Node.js (LTS recommended)
- npm
- PostgreSQL
- Git

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.

3. Set the values in `.env`:

   - `DATABASE_URL`: PostgreSQL connection string for your local database.
   - `JWT_ACCESS_SECRET`: a private random secret of at least 32 characters. Do not commit it.
   - `NODE_ENV`: use `development` locally.
   - `PORT`: HTTP port (default: 3000).

4. Generate the Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Apply committed migrations to the configured database:

   ```bash
   npx prisma migrate deploy
   ```

6. Start the API:

   ```bash
   npm run dev
   ```

The health endpoint is `GET http://localhost:3000/api/v1/health`.

## Useful commands

- `npm test` — run the automated test suite.
- `npm run db:generate` — generate the Prisma Client.
- `npm start` — start the server.
- `npm run dev` — start with Node.js watch mode.

## Environment and security

- Never commit `.env`, database passwords, JWT secrets, or production credentials.
- Use a unique, cryptographically random `JWT_ACCESS_SECRET` in each environment.
- Use a least-privilege PostgreSQL account for deployments rather than the local superuser.
- Do not expose stack traces or database error details to API clients.

## Current implementation notes

The repository contains several domain modules with dependency-injected routers and services. A module is not available over HTTP merely because its files exist: its router, repository implementations, and dependencies must be registered in `src/app.js`. Verify route registration and end-to-end coverage before treating any module as production-ready.

Database-backed integration tests require a reachable PostgreSQL database configured through `DATABASE_URL`. Keep test data isolated from production data.
