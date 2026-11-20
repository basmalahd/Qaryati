#!/bin/sh
set -e
echo "Applying migrations..."
npx prisma migrate deploy
echo "Seeding reference data..."
node prisma/seed.js
exec node src/server.js
